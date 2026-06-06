export interface DashboardWorkspace {
  context: DashboardUserContext;
  widgets: DashboardWidget[];
  kpis: DashboardKpi[];
  quickActions: DashboardQuickAction[];
  priorities: DashboardPriority[];
  pendingApprovals: DashboardApproval[];
  recentActivities: DashboardActivity[];
  smartAlerts: DashboardAlert[];
  moduleShortcuts: DashboardShortcut[];
  search: DashboardSearchMeta;
  charts: DashboardChart[] | null;
  profileCard: DashboardProfileCard | null;
  financialSummary: DashboardFinancialSummary | null;
}

export interface DashboardUserContext {
  userId: number | null;
  username: string;
  displayName: string;
  primaryRoleCode: string;
  primaryRoleName: string;
  roleCodes: string[];
  organizationId: number | null;
  organizationName: string;
  tenantId: string;
  welcomeTitle: string;
  focusMessage: string;
}

export interface DashboardWidget {
  key: string;
  type: string;
  title: string;
  subtitle: string;
  icon: string;
  route: string | null;
  section: string;
  displayOrder: number;
}

export interface DashboardKpi {
  key: string;
  label: string;
  value: string;
  helper: string;
  tone: DashboardTone;
  icon: string;
  route: string | null;
}

export interface DashboardQuickAction {
  key: string;
  label: string;
  description: string;
  icon: string;
  route: string | null;
  tone: DashboardTone;
  enabled: boolean;
}

export interface DashboardPriority {
  key: string;
  title: string;
  description: string;
  dueLabel: string;
  tone: DashboardTone;
  icon: string;
  route: string | null;
  entityType: string | null;
  entityId: string | null;
}

export interface DashboardApproval {
  key: string;
  title: string;
  description: string;
  requester: string | null;
  status: string;
  tone: DashboardTone;
  route: string | null;
  entityType: string | null;
  entityId: string | null;
}

export interface DashboardActivity {
  key: string;
  title: string;
  description: string;
  actor: string;
  occurredAt: string | null;
  tone: DashboardTone;
  icon: string;
  route: string | null;
}

export interface DashboardAlert {
  key: string;
  title: string;
  description: string;
  severity: string;
  tone: DashboardTone;
  icon: string;
  route: string | null;
  entityType: string | null;
  entityId: string | null;
}

export interface DashboardShortcut {
  key: string;
  label: string;
  description: string;
  icon: string;
  route: string | null;
  count: number | null;
  tone: DashboardTone;
}

export interface DashboardSearchMeta {
  placeholder: string;
  categories: string[];
}

export type DashboardChartType = 'line' | 'bar' | 'doughnut' | 'pie';

export interface DashboardChart {
  key: string;
  title: string;
  subtitle: string | null;
  type: DashboardChartType | string;
  labels: string[];
  datasets: DashboardChartDataset[];
  tone: DashboardTone;
  emptyMessage: string | null;
}

export interface DashboardChartDataset {
  label: string;
  data: number[];
  tone: DashboardTone;
}

export interface DashboardProfileCard {
  displayName: string;
  roleLabel: string;
  classLabel: string | null;
  sectionLabel: string | null;
  rollNumber: string | null;
  avatarInitials: string;
  contactPhone: string | null;
  contactEmail: string | null;
  attendanceRate: number | null;
  presentDays: number | null;
  absentDays: number | null;
  totalDays: number | null;
  childOf: string | null;
  classTeacherName: string | null;
}

export interface DashboardFinancialSummary {
  currencySymbol: string;
  totalRevenue: string;
  paid: string;
  pending: string;
  overdue: string;
  invoicesPaid: number | null;
  invoicesPending: number | null;
  invoicesOverdue: number | null;
  helper: string | null;
}

export interface DashboardSearchResponse {
  query: string;
  results: DashboardSearchResult[];
  supportedCategories: string[];
}

export interface DashboardSearchResult {
  key: string;
  entityType: string;
  entityId: string;
  title: string;
  subtitle: string | null;
  detail: string | null;
  icon: string;
  route: string | null;
  tone: DashboardTone;
  metadata: Record<string, unknown>;
}

export type DashboardTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | string;

export type DashboardActionTarget =
  | DashboardQuickAction
  | DashboardShortcut
  | DashboardPriority
  | DashboardApproval
  | DashboardAlert
  | DashboardActivity;