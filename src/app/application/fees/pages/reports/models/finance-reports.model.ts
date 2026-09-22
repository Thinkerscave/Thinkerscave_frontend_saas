export type FinanceReportPeriod =
  | 'THIS_MONTH'
  | 'LAST_MONTH'
  | 'THIS_QUARTER'
  | 'THIS_ACADEMIC_YEAR'
  | 'THIS_FINANCIAL_YEAR'
  | 'CUSTOM';

export interface FinanceReportQuery {
  academicYearId: number | null;
  period: FinanceReportPeriod;
  from: string | null;
  to: string | null;
}

export interface FinanceReportFilter {
  academicYearId: number | null;
  academicYearName: string | null;
  period: FinanceReportPeriod;
  label: string;
  from: string | null;
  to: string | null;
  outstandingAsOf: string | null;
}

export interface FinanceReportKpis {
  feeCollection: number;
  outstandingFees: number;
  payrollPaid: number;
  expensesPaid: number;
  totalOutflow: number;
  netOperationalFlow: number;
}

export interface FinanceTrendPoint {
  bucket: string;
  label: string;
  feeCollection: number;
  totalOutflow: number;
  difference: number;
}

export interface MonthlyAmount {
  bucket: string;
  label: string;
  amount: number;
}

export interface AmountPercentage {
  name: string;
  amount: number;
  percentage: number;
}

export interface FeeAnalytics {
  collectionTrend: MonthlyAmount[];
  collectionByCategory: AmountPercentage[];
  attributionMethod: string | null;
}

export interface OutstandingClass {
  classId: number | null;
  className: string;
  studentsDue: number;
  outstandingAmount: number;
}

export interface FinanceOutstanding {
  amount: number;
  studentsDue: number;
  byClass: OutstandingClass[];
}

export interface FinancePayroll {
  generatedAmount: number;
  paidAmount: number;
  pendingAmount: number;
  employeeCount: number;
  costTrend: MonthlyAmount[];
}

export interface StatusAmount {
  status: string;
  count: number;
  amount: number;
}

export interface ExpenseHead {
  headId: number | null;
  headName: string;
  categoryName: string;
  amount: number;
  percentage: number;
  drillPath: string | null;
}

export interface FinanceExpenses {
  paidAmount: number;
  pendingApprovalAmount: number;
  pendingApprovalCount: number;
  approvedUnpaidAmount: number;
  approvedUnpaidCount: number;
  byCategory: AmountPercentage[];
  statusDistribution: StatusAmount[];
  topHeads: ExpenseHead[];
}

export interface AttentionItem {
  type: string;
  label: string;
  amount: number;
  count: number;
  drillPath: string | null;
}

export interface RecentFinancialActivity {
  type: string;
  date: string;
  reference: string;
  description: string;
  amount: number;
  status: string;
  drillPath: string | null;
}

export interface FinanceReportOverview {
  filter: FinanceReportFilter;
  kpis: FinanceReportKpis;
  incomeOutflowTrend: FinanceTrendPoint[];
  feeAnalytics: FeeAnalytics;
  outstanding: FinanceOutstanding;
  payroll: FinancePayroll;
  expenses: FinanceExpenses;
  attention: AttentionItem[];
  recentActivity: RecentFinancialActivity[];
}

export interface FinanceReportExport {
  blob: Blob;
  fileName: string;
}

export const FINANCE_REPORTS_RESOURCE = 'FINANCE_REPORTS';
