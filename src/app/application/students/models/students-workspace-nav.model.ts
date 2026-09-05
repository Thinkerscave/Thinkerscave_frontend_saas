export type StudentsWorkspacePage = 'directory' | 'alumni' | 'transfers';

export interface StudentsPageConfig {
  page: StudentsWorkspacePage;
  label: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}
