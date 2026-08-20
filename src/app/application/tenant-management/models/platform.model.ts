/** Platform Management — types aligned with backend platform module DTOs */

export type OrganizationStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'ARCHIVED';
export type InstitutionType =
  | 'PRE_SCHOOL' | 'PRIMARY_SCHOOL' | 'HIGH_SCHOOL' | 'HIGHER_SECONDARY' | 'SCHOOL'
  | 'COLLEGE' | 'UNIVERSITY' | 'COACHING' | 'TRAINING_INSTITUTE' | 'OTHER';
export type CustomerStatus = 'LEAD' | 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'YEARLY';
/** Backend supports PERCENTAGE and FLAT_AMOUNT; FLAT is kept for legacy seed/display mapping. */
export type DiscountType = 'PERCENTAGE' | 'FLAT_AMOUNT' | 'FLAT';
export type PromotionStatus = 'DRAFT' | 'ACTIVE' | 'EXPIRED' | 'ARCHIVED';
export type ProvisionStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'MAINTENANCE';
export type ProvisionJobStatus = 'QUEUED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
}

export interface PlatformDashboard {
  totalCustomers: number;
  totalOrganizations: number;
  activeOrganizations: number;
  trialOrganizations: number;
  suspendedOrganizations: number;
  renewalDue30Days: number;
  provisioningInProgress: number;
  totalSubscriptionPlans: number;
  activePromotions: number;
}

export interface OrganizationSummary {
  id: number;
  organizationCode: string;
  organizationName: string;
  shortName?: string;
  institutionType: InstitutionType;
  status: OrganizationStatus;
  email?: string;
  mobileNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  logoUrl?: string;
  onboardingCompleted?: boolean;
  active?: boolean;
  tenantIdentifier?: string;
  createdOn?: string;
  customerName?: string;
  planName?: string;
  ownerName?: string;
  studentCount?: number;
  nextRenewal?: string;
}

export interface TenantRegistry {
  id: number;
  tenantIdentifier: string;
  organizationId: number;
  organizationName?: string;
  schemaName?: string;
  databaseVersion?: string;
  migrationVersion?: string;
  templateVersion?: string;
  provisionStatus: ProvisionStatus;
  databaseSizeMb?: number;
  storageUsedMb?: number;
  studentCount?: number;
  staffCount?: number;
  branchCount?: number;
  classCount?: number;
  sectionCount?: number;
  usageRefreshedAt?: string;
  lastMigrationAt?: string;
  lastBackupAt?: string;
  lastHealthCheckAt?: string;
  tenantDomain?: string;
  customDomain?: string;
  maintenanceMode?: boolean;
  active?: boolean;
  remarks?: string;
  createdOn?: string;
}

export interface OrganizationDomain {
  id?: number;
  organizationId?: number;
  organizationName?: string;
  subdomain?: string;
  subDomain?: string;
  domain?: string;
  customDomain?: string;
  sslEnabled?: boolean;
  dnsVerified?: boolean;
  defaultDomain?: boolean;
  primaryDomain?: boolean;
  status?: string;
  verified?: boolean;
  primary?: boolean;
}

export interface OrganizationConfiguration {
  organizationId?: number;
  maxStudents?: number;
  maxStaff?: number;
  maxBranches?: number;
  storageLimitGb?: number;
  apiRequestLimit?: number;
  currency?: string;
  timeZone?: string;
  language?: string;
}

export interface FeatureOverride {
  id: number;
  organizationSubscriptionId?: number;
  featureId: number;
  featureCode?: string;
  featureName?: string;
  enabled: boolean;
  overrideReason?: string;
  remarks?: string;
  createdBy?: string;
}

export interface OrganizationSubscription {
  id: number;
  organizationId: number;
  organizationName?: string;
  organizationCode?: string;
  subscriptionPlanId: number;
  planCode?: string;
  planName?: string;
  promotionId?: number;
  promotionCode?: string;
  startDate?: string;
  endDate?: string;
  trialEndDate?: string;
  billingCycle?: BillingCycle;
  planPrice?: number;
  discountAmount?: number;
  finalAmount?: number;
  studentLimitOverride?: number;
  staffLimitOverride?: number;
  branchLimitOverride?: number;
  storageLimitOverride?: number;
  studentLimit?: number;
  staffLimit?: number;
  branchLimit?: number;
  storageLimitGb?: number;
  invoiceNumber?: string;
  autoRenew?: boolean;
  status: SubscriptionStatus;
  active?: boolean;
  remarks?: string;
  featureOverrides?: FeatureOverride[];
}

export interface OrganizationDetail {
  id: number;
  organizationCode: string;
  organizationName: string;
  shortName?: string;
  institutionType: InstitutionType;
  boardName?: string;
  status: OrganizationStatus;
  email?: string;
  mobileNumber?: string;
  adminFullName?: string;
  adminEmail?: string;
  adminMobile?: string;
  alternateMobileNumber?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  timeZone?: string;
  currency?: string;
  language?: string;
  logoUrl?: string;
  onboardingCompleted?: boolean;
  active?: boolean;
  remarks?: string;
  customerId?: number;
  customerCode?: string;
  customerName?: string;
  tenant?: TenantRegistry;
  domain?: OrganizationDomain;
  subscription?: OrganizationSubscription;
  entitledFeatures?: SubscriptionPlanFeature[];
  configuration?: OrganizationConfiguration;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
}

export interface OrganizationUpdatePayload {
  customerId: number;
  organizationName: string;
  shortName?: string;
  institutionType: InstitutionType;
  boardName?: string;
  email?: string;
  mobileNumber?: string;
  adminFullName?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  timeZone?: string;
  currency?: string;
  language?: string;
  logoUrl?: string;
  remarks?: string;
}

export type CustomerContactType = 'PRIMARY' | 'SECONDARY';

export interface CustomerContact {
  id: number;
  contactCode?: string;
  customerId?: number;
  contactType: CustomerContactType;
  fullName: string;
  email?: string;
  mobileNumber?: string;
  designation?: string;
  active?: boolean;
  createdOn?: string;
  createdBy?: string;
}

export interface CustomerContactPayload {
  fullName: string;
  email?: string;
  mobileNumber?: string;
  designation?: string;
}

export interface CustomerListItem {
  id: number;
  customerCode: string;
  customerName: string;
  logoUrl?: string;
  domain?: string;
  ownerName?: string;
  ownerEmail?: string;
  organizationCount?: number;
  status?: CustomerStatus;
  createdDate?: string;
  lastActivity?: string;
  lastActivityAt?: string;
  active?: boolean;
}

export interface Customer {
  id: number;
  customerCode: string;
  customerName: string;
  businessEmail: string;
  mobileNumber: string;
  alternateMobileNumber?: string;
  notes?: string;
  status?: CustomerStatus;
  ownerUserId?: number;
  /** Returned only on create */
  ownerUsername?: string;
  /** Returned only on create */
  temporaryPassword?: string;
  active?: boolean;
  organizationCount?: number;
  primaryContact?: CustomerContact | null;
  secondaryContact?: CustomerContact | null;
  contacts?: CustomerContact[];
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
}

export interface CustomerDetail extends Customer {
  organizations?: OrganizationSummary[];
}

export interface CustomerDashboard {
  totalCustomers: number;
  activeCustomers: number;
  trialCustomers: number;
  suspendedCustomers: number;
  archivedCustomers: number;
  totalOrganizations: number;
  annualRevenue: number;
  renewals30Days: number;
}

export interface EnumOption {
  code: string;
  label: string;
}

export interface CustomerMetadata {
  statuses: EnumOption[];
}

export interface CustomerCreatePayload {
  customerName: string;
  businessEmail: string;
  mobileNumber: string;
  alternateMobileNumber?: string;
  notes?: string;
  primaryContact: CustomerContactPayload;
  secondaryContact?: CustomerContactPayload;
}

export interface CustomerContactCreatePayload {
  fullName: string;
  email: string;
  mobileNumber: string;
  designation?: string;
  contactType: CustomerContactType;
}

export interface SubscriptionPlanFeature {
  id?: number;
  featureId: number;
  featureCode?: string;
  featureName?: string;
  featureKey?: string;
  module?: string;
  included?: boolean;
  enabled?: boolean;
  notes?: string;
  limitValue?: number;
}

export interface SubscriptionPlan {
  id: number;
  planCode: string;
  planName: string;
  description?: string;
  monthlyPrice?: number;
  quarterlyPrice?: number;
  halfYearlyPrice?: number;
  yearlyPrice?: number;
  studentLimit?: number;
  staffLimit?: number;
  branchLimit?: number;
  storageLimitGb?: number;
  apiRequestLimit?: number;
  trialDays?: number;
  displayOrder?: number;
  recommended?: boolean;
  customPlan?: boolean;
  visible?: boolean;
  active?: boolean;
  features?: SubscriptionPlanFeature[];
}

export interface PlatformFeature {
  id: number;
  featureCode: string;
  featureName: string;
  displayName?: string;
  module?: string;
  category?: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  premiumFeature?: boolean;
  defaultEnabled?: boolean;
  visible?: boolean;
  active?: boolean;
}

export interface PlatformFeaturePayload {
  featureCode: string;
  featureName: string;
  displayName?: string;
  module: string;
  category?: string;
  featureKey?: string;
  description?: string;
  icon?: string;
  displayOrder?: number;
  premiumFeature?: boolean;
  visible?: boolean;
  defaultEnabled?: boolean;
  remarks?: string;
}

export interface FeatureOverridePayload {
  organizationSubscriptionId: number;
  featureId: number;
  enabled?: boolean;
  overrideReason?: string;
  remarks?: string;
}

export interface Promotion {
  id: number;
  promotionCode: string;
  promotionName: string;
  description?: string;
  discountType: DiscountType;
  discountValue?: number;
  maximumDiscount?: number;
  validFrom?: string;
  validTo?: string;
  maximumUsage?: number;
  usedCount?: number;
  allowCustomPlan?: boolean;
  stackable?: boolean;
  autoApply?: boolean;
  status: PromotionStatus;
  active?: boolean;
}

export interface ProvisioningJob {
  id: number;
  jobCode: string;
  organizationId?: number;
  organizationName?: string;
  tenantRegistryId?: number;
  templateId?: number;
  templateName?: string;
  status: ProvisionJobStatus;
  currentStep?: string;
  progressPercentage?: number;
  startedAt?: string;
  completedAt?: string;
  durationSeconds?: number;
  retryCount?: number;
  errorMessage?: string;
  provisionedBy?: string;
  createdOn?: string;
}

export interface ProvisioningResult {
  organizationId: number;
  organizationCode: string;
  organizationName: string;
  tenantId?: number;
  tenantIdentifier?: string;
  schemaName?: string;
  subscriptionId?: number;
  provisioningJobId?: number;
  jobCode?: string;
  adminEmail?: string;
  adminUsername?: string;
  /** Returned only at provision time */
  temporaryPassword?: string;
  defaultDomain?: string;
  message?: string;
}

export interface ProvisionOrganizationPayload {
  existingCustomerId?: number;
  customerLegalName?: string;
  customerDisplayName?: string;
  customerEmail?: string;
  customerMobile?: string;
  organizationName: string;
  shortName?: string;
  institutionType: InstitutionType;
  tenantSubdomain?: string;
  boardName?: string;
  timeZone?: string;
  currency?: string;
  language?: string;
  orgEmail?: string;
  orgMobile?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  country?: string;
  logoUrl?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminMobile: string;
  subscriptionPlanId: number;
  billingCycle: BillingCycle;
  subscriptionStartDate?: string;
  trialEnabled?: boolean;
  enabledFeatureIds?: number[];
  disabledFeatureIds?: number[];
  promotionId?: number;
  promotionCode?: string;
  studentLimitOverride?: number;
  staffLimitOverride?: number;
  branchLimitOverride?: number;
  storageLimitOverride?: number;
  templateId?: number;
  remarks?: string;
}

export interface OrganizationQuery {
  status?: OrganizationStatus;
  institutionType?: InstitutionType;
  customerId?: number;
  search?: string;
  page?: number;
  size?: number;
  sort?: string;
}

export type CustomerSortOption =
  | 'nameAsc'
  | 'nameDesc'
  | 'email'
  | 'createdDesc'
  | 'orgCount'
  | 'lastActivity';

export type CustomerCreatedFilter = 'all' | 'today' | '7d' | '30d' | '90d' | 'year';

export interface CustomerQuery {
  status?: CustomerStatus;
  search?: string;
  activeOnly?: boolean;
  created?: CustomerCreatedFilter;
  page?: number;
  size?: number;
  sort?: CustomerSortOption;
}

export interface PlatformAuditLog {
  id: number;
  organizationId?: number;
  tenantCode?: string;
  eventType?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: number;
  actorUsername?: string;
  sourceIp?: string;
  changes?: string;
  summary?: string;
  occurredAt: string;
}

export interface PlatformSecurityAuditLog {
  id: number;
  eventCode: string;
  username?: string;
  tenantCode?: string;
  sourceIp?: string;
  success: boolean;
  severity?: string;
  message?: string;
  occurredAt: string;
}
