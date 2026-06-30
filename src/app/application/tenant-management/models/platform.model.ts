/** Platform Management — types aligned with backend platform module DTOs */

export type OrganizationStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'ARCHIVED';
export type InstitutionType =
  | 'PRE_SCHOOL' | 'PRIMARY_SCHOOL' | 'HIGH_SCHOOL' | 'HIGHER_SECONDARY' | 'SCHOOL'
  | 'COLLEGE' | 'UNIVERSITY' | 'COACHING' | 'TRAINING_INSTITUTE' | 'OTHER';
export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'PENDING';
export type CustomerType = 'INDIVIDUAL' | 'BUSINESS' | 'INSTITUTION' | 'GOVERNMENT' | 'SCHOOL' | 'COLLEGE' | 'UNIVERSITY' | 'COACHING' | 'TRAINING_INSTITUTE' | 'EDUCATION_GROUP' | 'TRUST' | 'COMPANY' | 'OTHER';
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
  subdomain?: string;
  customDomain?: string;
  verified?: boolean;
  sslEnabled?: boolean;
  primary?: boolean;
}

export interface OrganizationConfiguration {
  organizationId?: number;
  maxStudents?: number;
  maxStaff?: number;
  maxBranches?: number;
  storageLimitGb?: number;
  apiRequestLimit?: number;
}

export interface FeatureOverride {
  id: number;
  organizationSubscriptionId?: number;
  featureId: number;
  featureCode?: string;
  featureName?: string;
  enabled: boolean;
  remarks?: string;
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
  autoRenew?: boolean;
  status: SubscriptionStatus;
  active?: boolean;
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
  configuration?: OrganizationConfiguration;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
}

export interface Customer {
  id: number;
  customerCode: string;
  legalName: string;
  displayName: string;
  customerType?: CustomerType;
  status?: CustomerStatus;
  email?: string;
  mobileNumber?: string;
  city?: string;
  state?: string;
  country?: string;
  organizationCount?: number;
  active?: boolean;
}

export interface SubscriptionPlanFeature {
  id: number;
  featureId: number;
  featureCode?: string;
  featureName?: string;
  included: boolean;
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
  premiumFeature?: boolean;
  defaultEnabled?: boolean;
  active?: boolean;
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

export interface CustomerQuery {
  status?: CustomerStatus;
  customerType?: CustomerType;
  search?: string;
  page?: number;
  size?: number;
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
