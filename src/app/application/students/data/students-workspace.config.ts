import { StudentsPageConfig, StudentsWorkspacePage } from '../models/students-workspace-nav.model';

export const STUDENTS_PAGES: StudentsPageConfig[] = [
  {
    page: 'directory',
    label: 'Directory',
    title: 'Student Management',
    description: 'Comprehensive learner management for your institution.',
    icon: 'pi pi-users',
    route: '/app/students/directory'
  },
  {
    page: 'transfers',
    label: 'Transfers',
    title: 'Student Transfer',
    description: 'Manage transfer certificates and exit workflows.',
    icon: 'pi pi-arrow-right-arrow-left',
    route: '/app/students/transfers'
  },
  {
    page: 'documents',
    label: 'Documents',
    title: 'Document Vault',
    description: 'Centralized student document compliance and verification.',
    icon: 'pi pi-folder-open',
    route: '/app/students/documents'
  },
  {
    page: 'alumni',
    label: 'Alumni',
    title: 'Alumni Directory',
    description: 'Past graduates and alumni engagement records.',
    icon: 'pi pi-graduation-cap',
    route: '/app/students/alumni'
  }
];

export function studentsPageConfig(page: StudentsWorkspacePage): StudentsPageConfig {
  return STUDENTS_PAGES.find((p) => p.page === page) ?? STUDENTS_PAGES[0];
}
