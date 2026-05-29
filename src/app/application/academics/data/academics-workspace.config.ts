import {
  AcademicsActionMode,
  AcademicsNavGroup,
  AcademicsPageConfig,
  AcademicsQuickAction,
  AcademicsViewMode,
  AcademicsWorkspacePage
} from '../models/academics-workspace.model';

export const ACADEMICS_PAGES: AcademicsPageConfig[] = [
  {
    page: 'dashboard',
    label: 'Academic Dashboard',
    title: 'Academic Dashboard',
    eyebrow: 'Academic command center',
    description: 'Monitor academic delivery, curriculum readiness, teacher allocation, timetable coverage and upcoming school operations.',
    icon: 'pi pi-chart-line',
    route: '/app/academics/dashboard',
    primaryAction: 'Plan academic work',
    actionMode: 'calendar-event'
  },
  {
    page: 'years',
    label: 'Academic Years',
    title: 'Academic Years',
    eyebrow: 'Session lifecycle',
    description: 'Manage academic sessions, activation status, promotion windows and archive readiness in one guided timeline.',
    icon: 'pi pi-calendar-clock',
    route: '/app/academics/years',
    primaryAction: 'Create academic year',
    actionMode: 'year'
  },
  {
    page: 'classes',
    label: 'Classes & Sections',
    title: 'Classes & Sections',
    eyebrow: 'Structure studio',
    description: 'Review class capacity, section ownership, student distribution and homeroom readiness without repetitive cards.',
    icon: 'pi pi-sitemap',
    route: '/app/academics/classes',
    primaryAction: 'Create class',
    actionMode: 'class'
  },
  {
    page: 'subjects',
    label: 'Subjects',
    title: 'Subject Library',
    eyebrow: 'Learning catalog',
    description: 'Search, filter and manage the subject library with credits, weekly hours, lab split and curriculum readiness.',
    icon: 'pi pi-book',
    route: '/app/academics/subjects',
    primaryAction: 'Add subject',
    actionMode: 'subject'
  },
  {
    page: 'curriculum',
    label: 'Curriculum Planner',
    title: 'Curriculum Planner',
    eyebrow: 'Pacing workspace',
    description: 'Plan units, chapters, outcomes and weekly pacing with syllabus data and workload signals.',
    icon: 'pi pi-sliders-h',
    route: '/app/academics/curriculum',
    primaryAction: 'Import curriculum',
    actionMode: 'subject'
  },
  {
    page: 'syllabus',
    label: 'Syllabus Workspace',
    title: 'Teaching Delivery Workspace',
    eyebrow: 'Delivery tracking',
    description: 'Track chapter readiness, topic coverage, lesson flow and teacher-facing delivery signals.',
    icon: 'pi pi-list-check',
    route: '/app/academics/syllabus',
    primaryAction: 'Add subject',
    actionMode: 'subject'
  },
  {
    page: 'teacher-allocation',
    label: 'Teacher Allocation',
    title: 'Teacher Allocation',
    eyebrow: 'Workload balancing',
    description: 'Balance teachers across subjects, classes and sections with period load indicators and conflict-aware assignments.',
    icon: 'pi pi-users',
    route: '/app/academics/teacher-allocation',
    primaryAction: 'Assign teacher',
    actionMode: 'allocation'
  },
  {
    page: 'class-teacher-allocation',
    label: 'Class Teachers',
    title: 'Class Teacher Allocation',
    eyebrow: 'Homeroom ownership',
    description: 'Assign class teachers, clarify communication responsibility and monitor class health ownership.',
    icon: 'pi pi-user-plus',
    route: '/app/academics/class-teacher-allocation',
    primaryAction: 'Assign class teacher',
    actionMode: 'class-teacher'
  },
  {
    page: 'timetable',
    label: 'Timetable',
    title: 'Timetable Management',
    eyebrow: 'Weekly scheduler',
    description: 'Build weekly schedules with subject colors, teacher load visibility, room hints and conflict-aware planning.',
    icon: 'pi pi-table',
    route: '/app/academics/timetable',
    primaryAction: 'Add period',
    actionMode: 'timetable'
  },
  {
    page: 'calendar',
    label: 'Academic Calendar',
    title: 'Academic Calendar',
    eyebrow: 'Planning calendar',
    description: 'Coordinate exams, holidays, PTMs, deadlines and school activities through month, week and agenda views.',
    icon: 'pi pi-calendar',
    route: '/app/academics/calendar',
    primaryAction: 'Add event',
    actionMode: 'calendar-event'
  },
  {
    page: 'hierarchy',
    label: 'Institution Hierarchy',
    title: 'Institution Hierarchy',
    eyebrow: 'Academic organization tree',
    description: 'Understand School, Wing, Stream, Class and Section relationships with ownership and capacity signals.',
    icon: 'pi pi-share-alt',
    route: '/app/academics/hierarchy',
    primaryAction: 'Create section',
    actionMode: 'section'
  },
  {
    page: 'settings',
    label: 'Academic Settings',
    title: 'Academic Settings',
    eyebrow: 'Rules and defaults',
    description: 'Tune timetable rules, attendance linkage, grading defaults, promotion policy and curriculum governance.',
    icon: 'pi pi-cog',
    route: '/app/academics/settings',
    primaryAction: 'Update setting',
    actionMode: 'settings'
  }
];

export const ACADEMICS_NAV_GROUPS: AcademicsNavGroup[] = [
  { label: 'Overview', icon: 'pi pi-sparkles', pages: ['dashboard'] },
  { label: 'Structure', icon: 'pi pi-sitemap', pages: ['years', 'classes', 'hierarchy'] },
  { label: 'Learning', icon: 'pi pi-book', pages: ['subjects', 'curriculum', 'syllabus'] },
  { label: 'Teaching', icon: 'pi pi-users', pages: ['teacher-allocation', 'class-teacher-allocation', 'timetable'] },
  { label: 'Planning', icon: 'pi pi-calendar', pages: ['calendar', 'settings'] }
];

export const ACADEMICS_QUICK_ACTIONS: AcademicsQuickAction[] = [
  { id: 'create-class', label: 'Create class', helper: 'Add a new class group', icon: 'pi pi-plus-circle', tone: 'primary', actionMode: 'class', pages: ['dashboard', 'classes', 'hierarchy'] },
  { id: 'add-section', label: 'Add section', helper: 'Create a class section', icon: 'pi pi-th-large', tone: 'info', actionMode: 'section', pages: ['dashboard', 'classes', 'hierarchy'] },
  { id: 'add-subject', label: 'Add subject', helper: 'Grow the subject library', icon: 'pi pi-book', tone: 'success', actionMode: 'subject', pages: ['dashboard', 'subjects', 'curriculum', 'syllabus'] },
  { id: 'assign-teacher', label: 'Assign teacher', helper: 'Balance subject workload', icon: 'pi pi-users', tone: 'primary', actionMode: 'allocation', pages: ['dashboard', 'teacher-allocation', 'timetable'] },
  { id: 'assign-class-teacher', label: 'Assign class teacher', helper: 'Set homeroom ownership', icon: 'pi pi-user-plus', tone: 'warning', actionMode: 'class-teacher', pages: ['dashboard', 'class-teacher-allocation', 'classes'] },
  { id: 'add-period', label: 'Add period', helper: 'Place a timetable slot', icon: 'pi pi-clock', tone: 'info', actionMode: 'timetable', pages: ['dashboard', 'timetable', 'teacher-allocation'] },
  { id: 'add-event', label: 'Add event', helper: 'Schedule exam or activity', icon: 'pi pi-calendar-plus', tone: 'success', actionMode: 'calendar-event', pages: ['dashboard', 'calendar', 'years'] },
  { id: 'update-setting', label: 'Update setting', helper: 'Tune academic rules', icon: 'pi pi-cog', tone: 'neutral', actionMode: 'settings', pages: ['settings', 'dashboard'] }
];

export const ACADEMICS_VIEW_MODE: Record<AcademicsWorkspacePage, AcademicsViewMode> = {
  dashboard: 'dashboard',
  years: 'timeline',
  classes: 'matrix',
  subjects: 'table',
  curriculum: 'kanban',
  syllabus: 'planner',
  'teacher-allocation': 'planner',
  'class-teacher-allocation': 'matrix',
  timetable: 'planner',
  calendar: 'calendar',
  hierarchy: 'tree',
  settings: 'settings'
};

export const ACADEMICS_DAY_OPTIONS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

export const ACADEMICS_PERIODS = [
  { periodNumber: 1, startTime: '08:30', endTime: '09:15' },
  { periodNumber: 2, startTime: '09:15', endTime: '10:00' },
  { periodNumber: 3, startTime: '10:15', endTime: '11:00' },
  { periodNumber: 4, startTime: '11:00', endTime: '11:45' },
  { periodNumber: 5, startTime: '12:30', endTime: '13:15' },
  { periodNumber: 6, startTime: '13:15', endTime: '14:00' }
];

export const ACADEMICS_EVENT_TYPES = ['EXAM', 'HOLIDAY', 'MEETING', 'EVENT', 'VACATION', 'DEADLINE', 'OTHER'] as const;

export function pageConfig(page: AcademicsWorkspacePage): AcademicsPageConfig {
  return ACADEMICS_PAGES.find(item => item.page === page) ?? ACADEMICS_PAGES[0];
}

export function actionModeLabel(mode: AcademicsActionMode): string {
  const labels: Record<AcademicsActionMode, string> = {
    year: 'Create academic year',
    class: 'Create class',
    section: 'Create section',
    subject: 'Add subject',
    allocation: 'Assign a teacher to this class',
    'class-teacher': 'Assign a class teacher',
    timetable: 'Add timetable period',
    'calendar-event': 'Add academic calendar event',
    settings: 'Update academic setting'
  };

  return labels[mode];
}
