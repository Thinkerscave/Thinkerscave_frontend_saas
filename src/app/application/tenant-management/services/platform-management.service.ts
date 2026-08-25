import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { platformApi, auditApi } from '../../../shared/constants/api.endpoint';
import { unwrapApiResponse } from '../../../shared/utils/api-response.util';
import { AccessMenu } from '../../access-management/models/access.model';
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
  PlatformAuditLog,
  PlatformSecurityAuditLog,
  SpringPage,
  SubscriptionPlan,
  TenantRegistry
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
