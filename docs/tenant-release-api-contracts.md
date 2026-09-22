# Tenant release frontend API contracts

All responses may be either the DTO directly or the existing `{ success, data }` envelope. Pages are Spring-style `{ content, totalElements, totalPages, number, size }`.

## Releases — `/api/platform/releases`

- `GET /summary` → `ReleaseSummary`: `currentRelease`, `totalTenants`, `upToDate`, `pendingMigration`, `failedOrMaintenance`.
- `GET ?page&size` → page of releases.
- `POST /` creates a release with `releaseVersion`, `applicationVersion`, `targetDatabaseVersion`, `targetCatalogVersion`, and optional `releaseNotes`.
- `POST /{releaseId}/execute` starts backend-owned sequential migration/catalog orchestration. The frontend never loops over tenants.

A release contains `id`, `releaseId`, the four version fields, `status` (`DRAFT|READY|RELEASED|FAILED`), `createdAt`, optional `releasedAt`, and `createdBy`.

## Migrations — `/api/platform/migrations`

- `GET /tenants?page&size&search` → page of tenant release-operation rows.
- `GET /tenants/{tenantId}` → tenant detail.
- `GET /tenants/{tenantId}/history` → Flyway executions.
- `POST /tenants/{tenantId}/retry` → queued migration execution.
- `PUT /tenants/{tenantId}/maintenance` with `{ enabled, reason? }`.

Tenant rows include organization/tenant/schema identifiers; current and target application, DB, and catalog versions; separate `migrationStatus` and `catalogSyncStatus`; maintenance reason/timestamp; backend `healthStatus`; and last-operation timestamps. Operation status is `PENDING|RUNNING|SUCCESS|FAILED`.

Migration history includes `executionId`, `releaseId`, current/target/migration versions, timestamps, failed version, error, and retry count.

## Catalog sync — `/api/platform/catalog-sync`

- `GET /status` → aggregate synchronization status.
- `GET /tenants/{tenantId}/history` → catalog executions.
- `POST /tenants/{tenantId}/retry` → queued catalog retry.

Catalog history is intentionally separate from Flyway history. Synchronizing a catalog definition does **not** grant access. Effective access remains feature entitlement + effective permission + tenant context, enforced by the backend.

## Tenant health — `/api/platform/tenant-health`

- `GET /summary` → aggregate health counts.
- `GET /tenants?page&size&search` → `{ summary, tenants }`, where `tenants` is paged.
- `GET /tenants/{tenantId}` → one backend-computed health record.

Health records include actual DB/catalog versions, migration status, storage, provision status, `healthStatus` (`HEALTHY|WARNING|MAINTENANCE|CRITICAL`), optional score/issues, and `lastCheckAt`. The frontend does not derive health.

## Provisioning and audit

- Existing `POST /api/platform/provision` submits onboarding only after Review.
- `GET /api/platform/provision/jobs/{jobId}` returns the persisted job plus ordered `steps`: `code`, `label`, `sequence`, operation `status`, timestamps, and error.
- Existing audit endpoints should include `entityType`, `entityId`, `version`, `status`, `executionId`, `correlationId`, `errorDetails`, and metadata in addition to actor, tenant, action, IP, summary, and timestamp.
