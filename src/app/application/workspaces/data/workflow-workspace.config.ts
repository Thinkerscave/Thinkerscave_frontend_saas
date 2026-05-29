import { PipelineStage, WorkspaceNavItem } from '../models/workflow-workspace.model';

export const INQUIRY_NAV_ITEMS: WorkspaceNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', route: '/app/inquiry/dashboard', icon: 'pi pi-sparkles', description: 'Live admission pulse' },
  { id: 'pipeline', label: 'Inquiry Pipeline', route: '/app/inquiry/pipeline', icon: 'pi pi-sitemap', description: 'Stage movement' },
  { id: 'management', label: 'Inquiry Management', route: '/app/inquiry/management', icon: 'pi pi-user-plus', description: 'Guided capture' },
  { id: 'follow-ups', label: 'Follow-Up Center', route: '/app/inquiry/follow-ups', icon: 'pi pi-phone', description: 'Today and overdue' },
  { id: 'counseling', label: 'Counseling Sessions', route: '/app/inquiry/counseling', icon: 'pi pi-comments', description: 'Walk-ins and meetings' },
  { id: 'applications', label: 'Admission Applications', route: '/app/inquiry/applications', icon: 'pi pi-file-edit', description: 'Review queue' },
  { id: 'documents', label: 'Document Collection', route: '/app/inquiry/documents', icon: 'pi pi-folder-open', description: 'Checklist readiness' },
  { id: 'communication', label: 'Communication Center', route: '/app/inquiry/communication', icon: 'pi pi-send', description: 'Messages and calls' },
  { id: 'analytics', label: 'Analytics & Reports', route: '/app/inquiry/analytics', icon: 'pi pi-chart-line', description: 'Sources and conversion' }
];

export const STUDENT_NAV_ITEMS: WorkspaceNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', route: '/app/students/dashboard', icon: 'pi pi-th-large', description: 'Student health' },
  { id: 'directory', label: 'Student Directory', route: '/app/students/directory', icon: 'pi pi-users', description: 'Find and manage' },
  { id: 'profiles', label: 'Student Profiles', route: '/app/students/profiles', icon: 'pi pi-id-card', description: '360 degree record' },
  { id: 'admissions', label: 'Admissions', route: '/app/students/admissions', icon: 'pi pi-user-plus', description: 'Joined pipeline' },
  { id: 'classes', label: 'Classes', route: '/app/students/classes', icon: 'pi pi-building-columns', description: 'Class structure' },
  { id: 'sections', label: 'Sections', route: '/app/students/sections', icon: 'pi pi-table', description: 'Section balance' },
  { id: 'promotion', label: 'Promotion Center', route: '/app/students/promotion', icon: 'pi pi-arrow-up-right', description: 'Academic movement' },
  { id: 'transfer', label: 'Transfer Center', route: '/app/students/transfer', icon: 'pi pi-send', description: 'Movement requests' },
  { id: 'documents', label: 'Documents', route: '/app/students/documents', icon: 'pi pi-folder', description: 'Student files' },
  { id: 'parents', label: 'Parent Directory', route: '/app/students/parents', icon: 'pi pi-address-book', description: 'Family links' },
  { id: 'id-cards', label: 'ID Cards', route: '/app/students/id-cards', icon: 'pi pi-qrcode', description: 'Card issuing' },
  { id: 'alumni', label: 'Alumni', route: '/app/students/alumni', icon: 'pi pi-verified', description: 'Lifecycle records' }
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

export const STUDENT_PROFILE_TABS = ['Overview', 'Academics', 'Attendance', 'Fees', 'Documents', 'Medical', 'Communication', 'Timeline'];

export const REQUIRED_ADMISSION_DOCUMENTS = [
  'Birth Certificate',
  'Previous Marksheet',
  'Transfer Certificate',
  'Address Proof',
  'Photo'
];