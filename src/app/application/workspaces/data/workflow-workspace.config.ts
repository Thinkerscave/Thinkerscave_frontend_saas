import { PipelineStage, WorkspaceNavItem } from '../models/workflow-workspace.model';

// Admissions module — spec defines three pages only: Inquiry Center, Admission Center, Settings.
// Legacy page IDs (pipeline, follow-ups, counseling, applications, documents, communication, analytics)
// remain reachable via /app/inquiry/* redirects but are no longer surfaced as separate tabs.
export const INQUIRY_NAV_ITEMS: WorkspaceNavItem[] = [
  { id: 'dashboard', label: 'Inquiry Center', route: '/app/admissions/inquiry-center', icon: 'pi pi-sparkles', description: 'Inquiry pipeline, follow-ups, counseling' },
  { id: 'applications', label: 'Admission Center', route: '/app/admissions/admission-center', icon: 'pi pi-file-edit', description: 'Admissions, documents, enrollment' },
  { id: 'settings', label: 'Settings', route: '/app/admissions/settings', icon: 'pi pi-cog', description: 'Sources, statuses, documents, rules' }
];

// Student Management — spec defines five pages: Students, Academic Movement, Student Movement, Documents, Alumni.
export const STUDENT_NAV_ITEMS: WorkspaceNavItem[] = [
  { id: 'directory', label: 'Students', route: '/app/students/directory', icon: 'pi pi-users', description: 'Active, inactive, alumni records' },
  { id: 'promotion', label: 'Academic Movement', route: '/app/students/academic-movement', icon: 'pi pi-arrow-up-right', description: 'Promotion and progression' },
  { id: 'transfer', label: 'Student Movement', route: '/app/students/student-movement', icon: 'pi pi-send', description: 'Transfers, withdrawals, readmissions' },
  { id: 'documents', label: 'Documents', route: '/app/students/documents', icon: 'pi pi-folder', description: 'Student document vault' },
  { id: 'alumni', label: 'Alumni', route: '/app/students/alumni', icon: 'pi pi-verified', description: 'Lifecycle alumni directory' }
];

export const INQUIRY_PIPELINE_STAGES: PipelineStage[] = [
  { id: 'NEW', label: 'New', description: 'Fresh inquiries waiting for qualification', tone: 'info' },
  { id: 'CONTACTED', label: 'Contacted', description: 'Initial conversation completed', tone: 'neutral' },
  { id: 'INTERESTED', label: 'Interested', description: 'Family is considering admission', tone: 'warning' },
  { id: 'COUNSELING', label: 'Counseling', description: 'Session or campus visit scheduled', tone: 'info' },
  { id: 'DOCUMENTS_PENDING', label: 'Documents Pending', description: 'Admission documents are being collected', tone: 'warning' },
  { id: 'READY_FOR_ADMISSION', label: 'Ready For Admission', description: 'Ready for application review', tone: 'success' },
  { id: 'CONVERTED', label: 'Admission Completed', description: 'Converted into a student record', tone: 'success' },
  { id: 'LOST', label: 'Lost', description: 'Closed after a negative outcome', tone: 'danger' }
];

export const STUDENT_PROFILE_TABS = ['Overview', 'Personal', 'Family', 'Academic', 'Attendance', 'Fees', 'Documents', 'Medical', 'Portfolio', 'Timeline'];

export const REQUIRED_ADMISSION_DOCUMENTS = [
  'Birth Certificate',
  'Previous Marksheet',
  'Transfer Certificate',
  'Address Proof',
  'Photo'
];