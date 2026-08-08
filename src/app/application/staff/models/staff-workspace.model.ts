export type StaffWorkspacePage =
  | 'directory'
  | 'responsibilities'
  | 'payroll'
  | 'leave';

export interface StaffPageConfig {
  page: StaffWorkspacePage;
  label: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}
