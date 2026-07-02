export type StudentsWorkspacePage = 'directory' | 'transfers' | 'documents' | 'alumni';

export interface StudentsPageConfig {
  page: StudentsWorkspacePage;
  label: string;
  title: string;
  description: string;
  icon: string;
  route: string;
}
