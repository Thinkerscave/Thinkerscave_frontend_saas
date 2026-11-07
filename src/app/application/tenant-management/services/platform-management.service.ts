import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  platformApi,
  auditApi,
  platformCatalogSyncApi,
  platformMigrationApi,
  platformMigrationCenterApi,
  platformReleaseApi,
  platformTenantHealthApi
} from '../../../shared/constants/api.endpoint';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { AccessMenu, RetentionPurgeResult, RetentionTaskStatus } from '../../access-management/models/access.model';
import {
  Customer,
  CustomerContact,
  CustomerContactCreatePayload,
  CustomerCreatePayload,
  CustomerDashboard,
  CustomerDetail,
  CustomerListItem,
  CustomerMetadata,
  CustomerQuery,
  CustomerSortOption,
  OrganizationDetail,
  OrganizationQuery,
  OrganizationSummary,
  OrganizationUpdatePayload,
  PlatformDashboard,
  PlatformFeature,
  PlatformFeaturePayload,
  FeatureOverride,
  FeatureOverridePayload,
  Promotion,
  ProvisionOrganizationPayload,
  ProvisioningJob,
  ProvisioningResult,
  ProvisioningJobDetail,
  PlatformAuditLog,
  PlatformSecurityAuditLog,
  CatalogSyncExecution,
  CatalogOverview,
  CreateReleasePayload,
  ExecutionJob,
  LocalMigrationRun,
  LocalMigrationStatus,
  MigrationAuditEvent,
  MigrationCenterOverview,
  MigrationExecution,
  MigrationPreview,
  MigrationScript,
  PlatformRelease,
  ReleaseDetail,
  ReleaseOverview,
  ReleaseSummary,
  ReleaseValidation,
  SpringPage,
  SubscriptionPlan,
  TenantHealthResponse,
  TenantMigrationDetail,
  TenantMigrationResult,
  TenantRegistry,
  TenantReleaseDetail,
  TenantReleaseOperation
} from '../models/platform.model';

@Injectable({ providedIn: 'root' })
export class PlatformManagementService {
  private readonly http = inject(HttpClient);

  getDashboard(): Observable<PlatformDashboard> {
    return this.http.get<unknown>(platformApi.dashboard).pipe(
      map(r => unwrapApiResponse<PlatformDashboard>(r, this.emptyDashboard()))
    );
  }

  getOrganizations(query: OrganizationQuery = {}): Observable<SpringPage<OrganizationSummary>> {
    let params = new HttpParams();
    if (query.status) params = params.set('status', query.status);
    if (query.institutionType) params = params.set('institutionType', query.institutionType);
    if (query.customerId) params = params.set('customerId', query.customerId);
    if (query.search) params = params.set('search', query.search);
    params = params.set('page', String(query.page ?? 0));
    params = params.set('size', String(query.size ?? 20));
    if (query.sort) params = params.set('sort', query.sort);

    return this.http.get<unknown>(platformApi.organizations, { params }).pipe(
      map(r => unwrapApiResponse<SpringPage<OrganizationSummary>>(r, this.emptyPage()))
    );
  }

  getOrganization(id: number): Observable<OrganizationDetail> {
    return this.http.get<unknown>(platformApi.organizationById(id)).pipe(
      map(r => unwrapApiResponse<OrganizationDetail>(r, {} as OrganizationDetail))
    );
  }

  downloadOrganizationInvoicePdf(id: number): Observable<Blob> {
    return this.http.get(platformApi.organizationInvoicePdf(id), { responseType: 'blob' });
  }

  updateOrganization(id: number, payload: OrganizationUpdatePayload): Observable<OrganizationSummary> {
    return this.http.put<unknown>(platformApi.organizationById(id), payload).pipe(
      map(r => unwrapApiResponse<OrganizationSummary>(r, {} as OrganizationSummary))
    );
  }

  activateOrganization(id: number): Observable<OrganizationSummary> {
    return this.http.post<unknown>(platformApi.activateOrganization(id), {}).pipe(
      map(r => unwrapApiResponse<OrganizationSummary>(r, {} as OrganizationSummary))
    );
  }

  suspendOrganization(id: number): Observable<OrganizationSummary> {
    return this.http.post<unknown>(platformApi.suspendOrganization(id), {}).pipe(
      map(r => unwrapApiResponse<OrganizationSummary>(r, {} as OrganizationSummary))
    );
  }

  archiveOrganization(id: number): Observable<void> {
    return this.http.post<unknown>(platformApi.archiveOrganization(id), {}).pipe(map(() => undefined));
  }

  getCustomers(query: CustomerQuery = {}): Observable<SpringPage<CustomerListItem>> {
    let params = new HttpParams();
    if (query.status) params = params.set('status', query.status);
    if (query.search) params = params.set('search', query.search);
    if (query.activeOnly === false) params = params.set('activeOnly', 'false');
    if (query.created && query.created !== 'all') params = params.set('created', query.created);
    params = params.set('page', String(query.page ?? 0));
    params = params.set('size', String(query.size ?? 20));
    const sort = mapCustomerSort(query.sort);
    if (sort) params = params.set('sort', sort);

    return this.http.get<unknown>(platformApi.customers, { params }).pipe(
      map(r => unwrapApiResponse<SpringPage<CustomerListItem>>(r, this.emptyPage()))
    );
  }

  getCustomerDashboard(): Observable<CustomerDashboard> {
    return this.http.get<unknown>(platformApi.customerDashboard).pipe(
      map(r => unwrapApiResponse<CustomerDashboard>(r, {
        totalCustomers: 0, activeCustomers: 0, trialCustomers: 0, suspendedCustomers: 0,
        archivedCustomers: 0, totalOrganizations: 0, annualRevenue: 0, renewals30Days: 0
      }))
    );
  }

  getCustomerMetadata(): Observable<CustomerMetadata> {
    return this.http.get<unknown>(platformApi.customerMetadata).pipe(
      map(r => unwrapApiResponse<CustomerMetadata>(r, { statuses: [] }))
    );
  }

  getCustomer(id: number): Observable<CustomerDetail> {
    return this.http.get<unknown>(platformApi.customerById(id)).pipe(
      map(r => unwrapApiResponse<CustomerDetail>(r, {} as CustomerDetail))
    );
  }

  createCustomer(payload: CustomerCreatePayload): Observable<Customer> {
    return this.http.post<unknown>(platformApi.customers, payload).pipe(
      map(r => unwrapApiResponse<Customer>(r, {} as Customer))
    );
  }

  updateCustomer(id: number, payload: CustomerCreatePayload): Observable<Customer> {
    return this.http.put<unknown>(platformApi.customerById(id), payload).pipe(
      map(r => unwrapApiResponse<Customer>(r, {} as Customer))
    );
  }

  suspendCustomer(id: number): Observable<Customer> {
    return this.http.patch<unknown>(platformApi.customerStatus(id), { status: 'SUSPENDED' }).pipe(
      map(r => unwrapApiResponse<Customer>(r, {} as Customer))
    );
  }

  activateCustomer(id: number): Observable<Customer> {
    return this.http.patch<unknown>(platformApi.customerStatus(id), { status: 'ACTIVE' }).pipe(
      map(r => unwrapApiResponse<Customer>(r, {} as Customer))
    );
  }

  archiveCustomer(id: number): Observable<void> {
    return this.http.delete<unknown>(platformApi.customerById(id)).pipe(map(() => undefined));
  }

  restoreCustomer(id: number): Observable<void> {
    return this.http.post<unknown>(platformApi.customerRestore(id), {}).pipe(map(() => undefined));
  }

  permanentlyDeleteCustomer(id: number): Observable<void> {
    return this.http.delete<unknown>(platformApi.customerPermanentDelete(id)).pipe(map(() => undefined));
  }

  addCustomerContact(customerId: number, payload: CustomerContactCreatePayload): Observable<CustomerContact> {
    return this.http.post<unknown>(platformApi.customerContacts(customerId), payload).pipe(
      map(r => unwrapApiResponse<CustomerContact>(r, {} as CustomerContact))
    );
  }

  getSubscriptionPlans(): Observable<SubscriptionPlan[]> {
    return this.http.get<unknown>(platformApi.subscriptionPlans).pipe(
      map(r => unwrapApiResponse<SubscriptionPlan[]>(r, []))
    );
  }

  getFeatures(): Observable<PlatformFeature[]> {
    return this.http.get<unknown>(platformApi.features).pipe(
      map(r => unwrapApiResponse<PlatformFeature[]>(r, []))
    );
  }

  createFeature(payload: PlatformFeaturePayload): Observable<PlatformFeature> {
    return this.http.post<unknown>(platformApi.features, payload).pipe(
      map(r => unwrapApiResponse<PlatformFeature>(r, {} as PlatformFeature))
    );
  }

  updateFeature(id: number, payload: PlatformFeaturePayload): Observable<PlatformFeature> {
    return this.http.put<unknown>(platformApi.featureById(id), payload).pipe(
      map(r => unwrapApiResponse<PlatformFeature>(r, {} as PlatformFeature))
    );
  }

  deleteFeature(id: number): Observable<void> {
    return this.http.delete<unknown>(platformApi.featureById(id)).pipe(map(() => undefined));
  }

  getFeatureMenus(id: number): Observable<AccessMenu[]> {
    return this.http.get<unknown>(platformApi.featureMenus(id)).pipe(
      map(r => unwrapApiResponse<AccessMenu[]>(r, []))
    );
  }

  replaceFeatureMenus(id: number, menuIds: number[]): Observable<AccessMenu[]> {
    return this.http.put<unknown>(platformApi.featureMenus(id), { menuIds }).pipe(
      map(r => unwrapApiResponse<AccessMenu[]>(r, []))
    );
  }

  createFeatureOverride(payload: FeatureOverridePayload): Observable<FeatureOverride> {
    return this.http.post<unknown>(platformApi.featureOverrides, payload).pipe(
      map(r => unwrapApiResponse<FeatureOverride>(r, {} as FeatureOverride))
    );
  }

  updateFeatureOverride(id: number, payload: Partial<FeatureOverridePayload>): Observable<FeatureOverride> {
    return this.http.put<unknown>(platformApi.featureOverrideById(id), payload).pipe(
      map(r => unwrapApiResponse<FeatureOverride>(r, {} as FeatureOverride))
    );
  }

  deleteFeatureOverride(id: number): Observable<void> {
    return this.http.delete<unknown>(platformApi.featureOverrideById(id)).pipe(map(() => undefined));
  }

  getPromotions(): Observable<Promotion[]> {
    return this.http.get<unknown>(platformApi.promotions).pipe(
      map(r => unwrapApiResponse<Promotion[]>(r, []))
    );
  }

  createPromotion(payload: Partial<Promotion>): Observable<Promotion> {
    return this.http.post<unknown>(platformApi.promotions, payload).pipe(
      map(r => unwrapApiResponse<Promotion>(r, {} as Promotion))
    );
  }

  updatePromotion(id: number, payload: Partial<Promotion>): Observable<Promotion> {
    return this.http.put<unknown>(platformApi.promotionById(id), payload).pipe(
      map(r => unwrapApiResponse<Promotion>(r, {} as Promotion))
    );
  }

  archivePromotion(id: number): Observable<void> {
    return this.http.delete<unknown>(platformApi.promotionById(id)).pipe(map(() => undefined));
  }

  getTenantRegistry(page = 0, size = 20, search?: string): Observable<SpringPage<TenantRegistry>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (search) params = params.set('search', search);
    return this.http.get<unknown>(platformApi.tenantRegistry, { params }).pipe(
      map(r => unwrapApiResponse<SpringPage<TenantRegistry>>(r, this.emptyPage()))
    );
  }

  setTenantMaintenance(id: number): Observable<TenantRegistry> {
    return this.http.post<unknown>(platformApi.tenantMaintenance(id), {}).pipe(
      map(r => unwrapApiResponse<TenantRegistry>(r, {} as TenantRegistry))
    );
  }

  resumeTenant(id: number): Observable<TenantRegistry> {
    return this.http.post<unknown>(platformApi.tenantResume(id), {}).pipe(
      map(r => unwrapApiResponse<TenantRegistry>(r, {} as TenantRegistry))
    );
  }

  triggerTenantMigration(id: number): Observable<void> {
    return this.http.post<unknown>(platformApi.tenantMigrate(id), {}).pipe(map(() => undefined));
  }

  triggerTenantBackup(id: number): Observable<void> {
    return this.http.post<unknown>(platformApi.tenantBackup(id), {}).pipe(map(() => undefined));
  }

  getProvisionJobs(page = 0, size = 20, search?: string): Observable<SpringPage<ProvisioningJob>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (search) params = params.set('search', search);
    return this.http.get<unknown>(platformApi.provisionJobs, { params }).pipe(
      map(r => unwrapApiResponse<SpringPage<ProvisioningJob>>(r, this.emptyPage()))
    );
  }

  retryProvisionJob(id: number): Observable<ProvisioningJob> {
    return this.http.post<unknown>(platformApi.retryProvisionJob(id), {}).pipe(
      map(r => unwrapApiResponse<ProvisioningJob>(r, {} as ProvisioningJob))
    );
  }

  getProvisionJob(id: number): Observable<ProvisioningJobDetail> {
    return this.http.get<unknown>(platformApi.provisionJobById(id)).pipe(
      map(r => unwrapApiResponse<ProvisioningJobDetail>(r, {} as ProvisioningJobDetail))
    );
  }

  provisionOrganization(payload: ProvisionOrganizationPayload): Observable<ProvisioningResult> {
    return this.http.post<unknown>(platformApi.provision, payload, {
      headers: { 'X-Skip-Error-Toast': '1' }
    }).pipe(
      map(r => unwrapApiResponse<ProvisioningResult>(r, {} as ProvisioningResult))
    );
  }

  checkDomainAvailability(subdomain: string): Observable<{
    subdomain: string;
    tenantIdentifier: string;
    previewDomain: string;
    available: boolean;
    message: string;
  }> {
    return this.http.get<unknown>(platformApi.provisionDomainAvailability(subdomain), {
      headers: { 'X-Skip-Error-Toast': '1' }
    }).pipe(
      map(r => unwrapApiResponse(r, {
        subdomain,
        tenantIdentifier: '',
        previewDomain: `${subdomain}.thinkerscave.app`,
        available: false,
        message: 'Unable to verify domain availability.'
      }))
    );
  }

  getAuditLogs(page = 0, size = 100): Observable<SpringPage<PlatformAuditLog>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<unknown>(auditApi.logs, { params }).pipe(
      map(r => this.mapPageResponse<PlatformAuditLog>(r))
    );
  }

  getSecurityAuditLogs(page = 0, size = 100): Observable<SpringPage<PlatformSecurityAuditLog>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<unknown>(auditApi.security, { params }).pipe(
      map(r => this.mapPageResponse<PlatformSecurityAuditLog>(r))
    );
  }

  getOperationAuditLogs(): Observable<PlatformAuditLog[]> {
    return this.http.get<unknown>(platformApi.operationAudit).pipe(
      map(response => {
        const rows = unwrapApiResponse<Record<string, unknown>[]>(response, []);
        return rows.map(row => ({
          id: Number(row['id']),
          tenantCode: String(row['tenant_identifier'] ?? ''),
          eventType: String(row['event_type'] ?? ''),
          action: String(row['event_type'] ?? ''),
          entityType: String(row['entity_type'] ?? ''),
          entityId: String(row['entity_id'] ?? ''),
          actorUsername: String(row['actor'] ?? 'system'),
          summary: String(row['details'] ?? row['event_type'] ?? ''),
          version: String(row['target_version'] ?? ''),
          status: String(row['status'] ?? ''),
          executionId: String(row['execution_id'] ?? ''),
          errorDetails: String(row['error_message'] ?? ''),
          occurredAt: String(row['created_on'] ?? '')
        }));
      })
    );
  }

  getReleaseSummary(): Observable<ReleaseSummary> {
    return this.http.get<unknown>(platformReleaseApi.summary).pipe(
      map(r => unwrapApiResponse<ReleaseSummary>(r, {
        totalTenants: 0, upToDate: 0, pendingMigration: 0, failedOrMaintenance: 0
      }))
    );
  }

  getReleaseHistory(page = 0, size = 20): Observable<SpringPage<PlatformRelease>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<unknown>(platformReleaseApi.releases, { params }).pipe(
      map(r => this.mapPageResponse<PlatformRelease>(r))
    );
  }

  createRelease(payload: CreateReleasePayload): Observable<PlatformRelease> {
    return this.http.post<unknown>(platformReleaseApi.releases, payload).pipe(
      map(r => unwrapApiResponse<PlatformRelease>(r, {} as PlatformRelease))
    );
  }

  executeRelease(id: number | string): Observable<PlatformRelease> {
    return this.http.post<unknown>(platformReleaseApi.execute(id), {}).pipe(
      map(r => unwrapApiResponse<PlatformRelease>(r, {} as PlatformRelease))
    );
  }

  getTenantReleaseOperations(page = 0, size = 50, search?: string): Observable<SpringPage<TenantReleaseOperation>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    return this.http.get<unknown>(platformMigrationApi.tenants, { params }).pipe(
      map(r => this.mapPageResponse<TenantReleaseOperation>(r))
    );
  }

  getTenantReleaseDetail(tenantId: number): Observable<TenantReleaseDetail> {
    return this.http.get<unknown>(platformMigrationApi.tenantDetail(tenantId)).pipe(
      map(r => unwrapApiResponse<TenantReleaseDetail>(r, {} as TenantReleaseDetail))
    );
  }

  getTenantMigrationHistory(tenantId: number): Observable<MigrationExecution[]> {
    return this.http.get<unknown>(platformMigrationApi.tenantHistory(tenantId)).pipe(
      map(r => unwrapApiResponse<MigrationExecution[]>(r, []))
    );
  }

  retryTenantMigration(tenantId: number): Observable<MigrationExecution> {
    return this.http.post<unknown>(platformMigrationApi.retry(tenantId), {}).pipe(
      map(r => unwrapApiResponse<MigrationExecution>(r, {} as MigrationExecution))
    );
  }

  setMigrationMaintenance(tenantId: number, enabled: boolean, reason?: string): Observable<TenantReleaseOperation> {
    return this.http.put<unknown>(platformMigrationApi.maintenance(tenantId), { enabled, reason }).pipe(
      map(r => unwrapApiResponse<TenantReleaseOperation>(r, {} as TenantReleaseOperation))
    );
  }

  getCatalogSyncHistory(tenantId: number): Observable<CatalogSyncExecution[]> {
    return this.http.get<unknown>(platformCatalogSyncApi.tenantHistory(tenantId)).pipe(
      map(r => unwrapApiResponse<CatalogSyncExecution[]>(r, []))
    );
  }

  retryCatalogSync(tenantId: number): Observable<CatalogSyncExecution> {
    return this.http.post<unknown>(platformCatalogSyncApi.retry(tenantId), {}).pipe(
      map(r => unwrapApiResponse<CatalogSyncExecution>(r, {} as CatalogSyncExecution))
    );
  }

  getTenantHealth(page = 0, size = 100, search?: string): Observable<TenantHealthResponse> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search) params = params.set('search', search);
    return this.http.get<unknown>(platformTenantHealthApi.tenants, { params }).pipe(
      map(r => unwrapApiResponse<TenantHealthResponse>(r, {
        summary: {
          totalTenants: 0, healthy: 0, warning: 0, maintenance: 0, critical: 0,
          checkedAt: new Date(0).toISOString()
        },
        tenants: this.emptyPage()
      }))
    );
  }

  /* ------------------------------------------------------------------ Migration Center */

  getMigrationCenterOverview(): Observable<MigrationCenterOverview> {
    return this.http.get<unknown>(platformMigrationCenterApi.overview).pipe(
      map(r => unwrapApiResponse<MigrationCenterOverview>(r, {
        totalTenants: 0, databaseCurrent: 0, databasePending: 0, databaseFailed: 0,
        catalogSynced: 0, catalogPending: 0, catalogFailed: 0, maintenanceTenants: 0,
        activeJobs: 0, failedJobs: 0, totalReleases: 0, migrationScripts: 0,
        checkedAt: new Date(0).toISOString()
      }))
    );
  }

  getMigrationCenterReleases(page = 0, size = 20): Observable<SpringPage<ReleaseOverview>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<unknown>(platformMigrationCenterApi.releases, { params }).pipe(
      map(r => this.mapPageResponse<ReleaseOverview>(r))
    );
  }

  getMigrationCenterRelease(id: number | string): Observable<ReleaseDetail> {
    return this.http.get<unknown>(platformMigrationCenterApi.releaseById(id)).pipe(
      map(r => unwrapApiResponse<ReleaseDetail>(r, {} as ReleaseDetail))
    );
  }

  validateMigrationCenterRelease(id: number | string): Observable<ReleaseValidation> {
    return this.http.post<unknown>(platformMigrationCenterApi.validateRelease(id), {}).pipe(
      map(r => unwrapApiResponse<ReleaseValidation>(r, {} as ReleaseValidation))
    );
  }

  executeMigrationCenterRelease(id: number | string): Observable<ReleaseOverview> {
    return this.http.post<unknown>(platformMigrationCenterApi.executeRelease(id), {}).pipe(
      map(r => unwrapApiResponse<ReleaseOverview>(r, {} as ReleaseOverview))
    );
  }

  createMigrationCenterRelease(payload: CreateReleasePayload): Observable<ReleaseOverview> {
    return this.http.post<unknown>(platformMigrationCenterApi.releases, payload, {
      headers: { 'X-Skip-Error-Toast': '1' }
    }).pipe(
      map(r => unwrapApiResponse<ReleaseOverview>(r, {} as ReleaseOverview))
    );
  }

  getMigrationCenterTenants(page = 0, size = 50, search?: string): Observable<SpringPage<TenantReleaseOperation>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (search) params = params.set('search', search);
    return this.http.get<unknown>(platformMigrationCenterApi.tenants, { params }).pipe(
      map(r => this.mapPageResponse<TenantReleaseOperation>(r))
    );
  }

  getMigrationCenterTenant(tenantId: number): Observable<TenantMigrationDetail> {
    return this.http.get<unknown>(platformMigrationCenterApi.tenantById(tenantId)).pipe(
      map(r => unwrapApiResponse<TenantMigrationDetail>(r, {} as TenantMigrationDetail))
    );
  }

  previewMigrationCenterTenant(tenantId: number, targetVersion?: string): Observable<MigrationPreview> {
    let params = new HttpParams();
    if (targetVersion) params = params.set('targetVersion', targetVersion);
    return this.http.get<unknown>(platformMigrationCenterApi.tenantPreview(tenantId), { params }).pipe(
      map(r => unwrapApiResponse<MigrationPreview>(r, {} as MigrationPreview))
    );
  }

  validateMigrationCenterTenant(tenantId: number, targetVersion?: string): Observable<MigrationPreview> {
    let params = new HttpParams();
    if (targetVersion) params = params.set('targetVersion', targetVersion);
    return this.http.post<unknown>(platformMigrationCenterApi.tenantValidate(tenantId), {}, { params }).pipe(
      map(r => unwrapApiResponse<MigrationPreview>(r, {} as MigrationPreview))
    );
  }

  migrateMigrationCenterTenant(tenantId: number, targetVersion?: string): Observable<TenantMigrationResult> {
    let params = new HttpParams();
    if (targetVersion) params = params.set('targetVersion', targetVersion);
    return this.http.post<unknown>(platformMigrationCenterApi.tenantMigrate(tenantId), {}, {
      params,
      headers: { 'X-Skip-Error-Toast': '1' }
    }).pipe(
      map(r => unwrapApiResponse<TenantMigrationResult>(r, {} as TenantMigrationResult))
    );
  }

  retryMigrationCenterTenantMigration(tenantId: number): Observable<MigrationExecution> {
    return this.http.post<unknown>(platformMigrationCenterApi.tenantRetryMigration(tenantId), {}).pipe(
      map(r => unwrapApiResponse<MigrationExecution>(r, {} as MigrationExecution))
    );
  }

  retryMigrationCenterTenantCatalog(tenantId: number): Observable<CatalogSyncExecution> {
    return this.http.post<unknown>(platformMigrationCenterApi.tenantRetryCatalog(tenantId), {}).pipe(
      map(r => unwrapApiResponse<CatalogSyncExecution>(r, {} as CatalogSyncExecution))
    );
  }

  setMigrationCenterMaintenance(
    tenantId: number, enabled: boolean, reason?: string
  ): Observable<TenantReleaseOperation> {
    return this.http.put<unknown>(platformMigrationCenterApi.tenantMaintenance(tenantId), { enabled, reason }).pipe(
      map(r => unwrapApiResponse<TenantReleaseOperation>(r, {} as TenantReleaseOperation))
    );
  }

  getMigrationCenterScripts(): Observable<MigrationScript[]> {
    return this.http.get<unknown>(platformMigrationCenterApi.scripts).pipe(
      map(r => unwrapApiResponse<MigrationScript[]>(r, []))
    );
  }

  getMigrationCenterCatalog(): Observable<CatalogOverview> {
    return this.http.get<unknown>(platformMigrationCenterApi.catalog).pipe(
      map(r => unwrapApiResponse<CatalogOverview>(r, {
        status: {
          totalTenants: 0, synchronizedTenants: 0, pendingTenants: 0, failedTenants: 0,
          checkedAt: new Date(0).toISOString()
        },
        versions: [],
        tenants: [],
        checkedAt: new Date(0).toISOString()
      }))
    );
  }

  getMigrationCenterJobs(
    page = 0,
    size = 25,
    filters: { jobType?: string; status?: string; search?: string } = {}
  ): Observable<SpringPage<ExecutionJob>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (filters.jobType) params = params.set('jobType', filters.jobType);
    if (filters.status) params = params.set('status', filters.status);
    if (filters.search) params = params.set('search', filters.search);
    return this.http.get<unknown>(platformMigrationCenterApi.jobs, { params }).pipe(
      map(r => this.mapPageResponse<ExecutionJob>(r))
    );
  }

  getMigrationCenterHistory(
    page = 0,
    size = 25,
    filters: { eventType?: string; search?: string } = {}
  ): Observable<SpringPage<MigrationAuditEvent>> {
    let params = new HttpParams().set('page', String(page)).set('size', String(size));
    if (filters.eventType) params = params.set('eventType', filters.eventType);
    if (filters.search) params = params.set('search', filters.search);
    return this.http.get<unknown>(platformMigrationCenterApi.history, { params }).pipe(
      map(r => this.mapPageResponse<MigrationAuditEvent>(r))
    );
  }

  getLocalMigrationStatus(): Observable<LocalMigrationStatus> {
    return this.http.get<unknown>(platformMigrationCenterApi.localStatus, {
      headers: { 'X-Skip-Error-Toast': '1' }
    }).pipe(
      map(r => unwrapApiResponse<LocalMigrationStatus>(r, {} as LocalMigrationStatus))
    );
  }

  validateLocalMigration(): Observable<LocalMigrationRun> {
    return this.http.post<unknown>(platformMigrationCenterApi.localValidate, {}, {
      headers: { 'X-Skip-Error-Toast': '1' }
    }).pipe(
      map(r => unwrapApiResponse<LocalMigrationRun>(r, {} as LocalMigrationRun))
    );
  }

  runLocalMigration(): Observable<LocalMigrationRun> {
    return this.http.post<unknown>(platformMigrationCenterApi.localMigrate, {}, {
      headers: { 'X-Skip-Error-Toast': '1' }
    }).pipe(
      map(r => unwrapApiResponse<LocalMigrationRun>(r, {} as LocalMigrationRun))
    );
  }

  private mapPageResponse<T>(response: unknown): SpringPage<T> {
    const page = unwrapApiResponse<{
      content?: T[];
      totalElements?: number;
      totalPages?: number;
      page?: number;
      number?: number;
      size?: number;
    }>(response, { content: [], totalElements: 0, totalPages: 0, page: 0, size: 10 });

    return {
      content: page.content ?? [],
      totalElements: page.totalElements ?? 0,
      totalPages: page.totalPages ?? 0,
      number: page.number ?? page.page ?? 0,
      size: page.size ?? 10
    };
  }

  private emptyPage<T>(): SpringPage<T> {
    return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 10 };
  }

  private emptyDashboard(): PlatformDashboard {
    return {
      totalCustomers: 0,
      totalOrganizations: 0,
      activeOrganizations: 0,
      trialOrganizations: 0,
      suspendedOrganizations: 0,
      renewalDue30Days: 0,
      provisioningInProgress: 0,
      totalSubscriptionPlans: 0,
      activePromotions: 0
    };
  }
}

function mapCustomerSort(sort?: CustomerSortOption): string | undefined {
  switch (sort) {
    case 'nameAsc': return 'customerName,asc';
    case 'nameDesc': return 'customerName,desc';
    case 'email': return 'businessEmail,asc';
    case 'createdDesc': return 'createdOn,desc';
    case 'orgCount': return 'createdOn,desc';
    case 'lastActivity': return 'updatedOn,desc';
    default: return undefined;
  }
}
