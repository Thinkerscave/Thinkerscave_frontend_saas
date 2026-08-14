import {
  AcademicsActionMode,
  AcademicsNavGroup,
  AcademicsPageConfig,
  AcademicsQuickAction,
  AcademicsWorkspacePage
} from '../models/academics-workspace.model';

export const ACADEMICS_PAGES: AcademicsPageConfig[] = [
  {
    page: 'academic-year',
    label: 'Academic Year',
    title: 'Academic Year',
    eyebrow: 'Lifecycle & history',
    description: 'Manage current, upcoming and historical academic years with approval and activation.',
    icon: 'pi pi-calendar',
    route: '/app/academics/academic-year',
    primaryAction: 'Create Academic Year',
    actionMode: 'year'
  },
  {
    page: 'classes-sections',
    label: 'Classes & Sections',
    title: 'Classes & Sections',
    eyebrow: 'Structure management',
    description: 'Manage classes, sections, class teachers and student distribution.',
    icon: 'pi pi-th-large',
    route: '/app/academics/classes-sections',
    primaryAction: 'Add Class',
    actionMode: 'class'
  },
  {
    page: 'subjects-mapping',
    label: 'Subjects & Mapping',
    title: 'Subjects & Mapping',
    eyebrow: 'Curriculum configuration',
    description: 'Configure subjects and define which subjects are taught for each class.',
    icon: 'pi pi-book',
    route: '/app/academics/subjects-mapping',
    primaryAction: 'Add Subject',
    actionMode: 'subject'
  },
  {
    page: 'teacher-allocation',
    label: 'Teacher Allocation',
    title: 'Teacher Allocation',
    eyebrow: 'Who teaches what',
    description: 'Assign teachers to class-section subjects and monitor weekly workload.',
    icon: 'pi pi-user-edit',
    route: '/app/academics/teacher-allocation',
    primaryAction: 'Assign teacher',
    actionMode: 'allocation'
  },
  {
    page: 'timetable',
    label: 'Timetable',
    title: 'Timetable Management',
    eyebrow: 'Weekly scheduler',
    description: 'Build weekly schedules with auto-generation, conflict detection and publishing capabilities.',
    icon: 'pi pi-table',
    route: '/app/academics/timetable',
    primaryAction: 'Add period',
    actionMode: 'timetable'
  },
  {
    page: 'teacher-arrangement',
    label: 'Teacher Arrangement',
    title: 'Teacher Arrangement',
    eyebrow: 'Leave & substitution management',
    description: 'Handle teacher absences, auto-suggest replacements, approve or override arrangements.',
    icon: 'pi pi-users',
    route: '/app/academics/teacher-arrangement',
    primaryAction: 'Record absence',
    actionMode: 'teacher-absence'
  },
  {
    page: 'calendar',
    label: 'Calendar',
    title: 'Academic Calendar',
    eyebrow: 'Planning calendar',
    description: 'Coordinate exams, holidays, PTMs, activities and school events through month, week and agenda views.',
    icon: 'pi pi-calendar',
    route: '/app/academics/academic-calendar',
    primaryAction: 'Add event',
    actionMode: 'calendar-event'
  },
  {
    page: 'syllabus',
    label: 'Syllabus',
    title: 'Syllabus & Progress Tracking',
    eyebrow: 'Teaching progress',
    description: 'Track syllabus structure, units, chapters, topics and monitor completion progress.',
    icon: 'pi pi-list-check',
    route: '/app/academics/syllabus-tracker',
    primaryAction: 'Update progress',
    actionMode: 'syllabus-progress'
  }
];

export const ACADEMICS_NAV_GROUPS: AcademicsNavGroup[] = [
  {
    label: 'Academics',
    icon: 'pi pi-book',
    pages: ['academic-year', 'classes-sections', 'subjects-mapping', 'teacher-allocation', 'timetable', 'teacher-arrangement', 'calendar', 'syllabus']
  }
];

export const ACADEMICS_QUICK_ACTIONS: AcademicsQuickAction[] = [
  { id: 'create-class', label: 'Create class', helper: 'Add a new class group', icon: 'pi pi-plus-circle', tone: 'primary', actionMode: 'class', pages: ['classes-sections'] },
  { id: 'add-section', label: 'Add section', helper: 'Create a class section', icon: 'pi pi-th-large', tone: 'info', actionMode: 'section', pages: ['classes-sections'] },
  { id: 'add-subject', label: 'Add subject', helper: 'Grow the subject library', icon: 'pi pi-book', tone: 'success', actionMode: 'subject', pages: ['subjects-mapping'] },
  { id: 'assign-teacher', label: 'Assign teacher', helper: 'Fill missing allocations', icon: 'pi pi-user-edit', tone: 'primary', actionMode: 'allocation', pages: ['teacher-allocation'] },
  { id: 'add-period', label: 'Add period', helper: 'Place a timetable slot', icon: 'pi pi-clock', tone: 'info', actionMode: 'timetable', pages: ['timetable'] },
  { id: 'auto-generate', label: 'Auto generate', helper: 'Generate timetable automatically', icon: 'pi pi-sparkles', tone: 'success', actionMode: 'timetable', pages: ['timetable'] },
  { id: 'record-absence', label: 'Record absence', helper: 'Log teacher absence', icon: 'pi pi-user-minus', tone: 'warning', actionMode: 'teacher-absence', pages: ['teacher-arrangement'] },
  { id: 'add-event', label: 'Add event', helper: 'Schedule exam or activity', icon: 'pi pi-calendar-plus', tone: 'success', actionMode: 'calendar-event', pages: ['calendar'] },
  { id: 'update-progress', label: 'Update progress', helper: 'Track syllabus completion', icon: 'pi pi-check-circle', tone: 'primary', actionMode: 'syllabus-progress', pages: ['syllabus'] }
];

export const ACADEMICS_DAY_OPTIONS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const;

export const ACADEMICS_PERIODS = [
  { periodNumber: 1, startTime: '08:30', endTime: '09:15' },
  { periodNumber: 2, startTime: '09:15', endTime: '10:00' },
  { periodNumber: 3, startTime: '10:15', endTime: '11:00' },
  { periodNumber: 4, startTime: '11:00', endTime: '11:45' },
  { periodNumber: 5, startTime: '12:30', endTime: '13:15' },
  { periodNumber: 6, startTime: '13:15', endTime: '14:00' },
  { periodNumber: 7, startTime: '14:00', endTime: '14:45' },
  { periodNumber: 8, startTime: '14:45', endTime: '15:30' }
];

export const ACADEMICS_EVENT_TYPES = ['HOLIDAY', 'EXAM', 'MEETING', 'EVENT', 'VACATION', 'DEADLINE', 'OTHER', 'PTM', 'ACTIVITY', 'COMPETITION'] as const;

export const ACADEMICS_EVENT_COLORS: Record<string, string> = {
  HOLIDAY: '#10B981',
  EXAM: '#EF4444',
  MEETING: '#F59E0B',
  EVENT: '#6366F1',
  VACATION: '#10B981',
  DEADLINE: '#F97316',
  PTM: '#8B5CF6',
  ACTIVITY: '#06B6D4',
  COMPETITION: '#EC4899',
  OTHER: '#64748B'
};

export const ACADEMICS_SUBJECT_TYPES = ['CORE', 'LANGUAGE', 'ACTIVITY', 'LAB', 'PRACTICAL'] as const;

export const ACADEMICS_ACADEMIC_STAGES = ['PRE_PRIMARY', 'PRIMARY', 'MIDDLE', 'SECONDARY', 'HIGHER_SECONDARY'] as const;

export function pageConfig(page: AcademicsWorkspacePage): AcademicsPageConfig {
  return ACADEMICS_PAGES.find(item => item.page === page) ?? ACADEMICS_PAGES[0];
}

export function actionModeLabel(mode: AcademicsActionMode): string {
  const labels: Record<AcademicsActionMode, string> = {
    year: 'Create academic year',
    class: 'Create class',
    section: 'Create section',
    subject: 'Add subject',
    allocation: 'Assign teacher',
    'class-teacher': 'Assign class teacher',
    timetable: 'Add timetable period',
    'calendar-event': 'Add calendar event',
    settings: 'Update setting',
    shift: 'Create shift',
    template: 'Create period template',
    'teacher-absence': 'Record teacher absence',
    'syllabus-progress': 'Update syllabus progress'
  };
  return labels[mode];
}
