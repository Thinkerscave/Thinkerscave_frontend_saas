import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { PlatformManagementService } from './platform-management.service';

describe('PlatformManagementService release operations', () => {
  let service: PlatformManagementService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PlatformManagementService, provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PlatformManagementService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the centralized release summary contract', () => {
    service.getReleaseSummary().subscribe(summary => expect(summary.totalTenants).toBe(4));

    const request = http.expectOne(req => req.url.endsWith('/api/platform/releases/summary'));
    expect(request.request.method).toBe('GET');
    request.flush({ success: true, data: {
      totalTenants: 4, upToDate: 3, pendingMigration: 1, failedOrMaintenance: 0
    } });
  });

  it('retries a single failed migration through the backend', () => {
    service.retryTenantMigration(42).subscribe(result => expect(result.executionId).toBe('mig-42'));

    const request = http.expectOne(req => req.url.endsWith('/api/platform/migrations/tenants/42/retry'));
    expect(request.request.method).toBe('POST');
    request.flush({ success: true, data: {
      executionId: 'mig-42', tenantId: 42, targetDatabaseVersion: 'V18',
      status: 'PENDING', retryCount: 1
    } });
  });

  it('uses backend-computed tenant health values', () => {
    service.getTenantHealth().subscribe(response => {
      expect(response.summary.healthy).toBe(1);
      expect(response.tenants.content[0].healthStatus).toBe('HEALTHY');
    });

    const request = http.expectOne(req => req.url.endsWith('/api/platform/tenant-health/tenants'));
    expect(request.request.params.get('page')).toBe('0');
    request.flush({ success: true, data: {
      summary: { totalTenants: 1, healthy: 1, warning: 0, maintenance: 0, critical: 0, checkedAt: '2026-09-16T10:00:00Z' },
      tenants: { content: [{
        tenantId: 1, organizationName: 'School', tenantIdentifier: 'tenant_school',
        schemaName: 'tenant_school', migrationStatus: 'SUCCESS', healthStatus: 'HEALTHY',
        maintenanceMode: false
      }], totalElements: 1, totalPages: 1, number: 0, size: 100 }
    } });
  });
});
