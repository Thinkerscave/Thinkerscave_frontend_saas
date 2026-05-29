export type AcademicsWorkspacePage =
  | 'dashboard'
  | 'years'
  | 'classes'
  | 'subjects'
  | 'curriculum'
  | 'syllabus'
  | 'teacher-allocation'
  | 'class-teacher-allocation'
  | 'timetable'
  | 'calendar'
  | 'hierarchy'
  | 'settings';

export interface AcademicsPageConfig {
  page: AcademicsWorkspacePage;
  label: string;
  title: string;
  eyebrow: string;
  description: string;
  icon: string;
  route: string;
  primaryAction: string;
  actionMode: AcademicsActionMode;
}

export type AcademicsActionMode = 'year' | 'class' | 'section' | 'subject' | 'allocation' | 'class-teacher' | 'timetable' | 'calendar-event' | 'settings';

export type AcademicsTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export type AcademicsViewMode = 'dashboard' | 'timeline' | 'table' | 'matrix' | 'planner' | 'kanban' | 'calendar' | 'tree' | 'settings';

export interface AcademicYear {
  academicYearId?: number;
  id?: number;
  organizationId?: number;
  yearCode: string;
  yearName?: string;
  startDate: string;
  endDate: string;
  isCurrent?: boolean;
  isActive?: boolean;
  description?: string;
}

export interface AcademicClass {
  classId?: number | string;
  className: string;
}

export interface AcademicSection {
  sectionId?: number | string;
  sectionName: string;
  classId?: number | string;
  classEntity?: AcademicClass;
}

export interface CourseModel {
  courseId?: number;
  courseCode?: string;
  courseName: string;
  description?: string;
  category?: string;
  durationYears?: number;
  totalSemesters?: number;
  isActive?: boolean;
}

export interface SubjectModel {
  subjectId?: number;
  subjectCode: string;
  subjectName: string;
  description?: string;
  category?: string;
  credits?: number;
  theoryHours?: number;
  labHours?: number;
  practicalHours?: number;
  isActive?: boolean;
}

export interface AcademicContainerModel {
  containerId?: number;
  containerType?: string;
  containerCode?: string;
  containerName: string;
  organisationId?: number;
  academicYearId?: number;
  courseId?: number;
  parentContainerId?: number;
  childContainers?: AcademicContainerModel[];
  level?: number;
  capacity?: number;
  currentStrength?: number;
}

export interface StaffModel {
  id?: number;
  staffId?: number;
  staffCode?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
}

export interface TeacherAllocationModel {
  allocationId?: number;
  classId?: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  subjectId?: number;
  subjectName?: string;
  teacherId?: number;
  teacherName?: string;
  academicYearId?: number;
  semesterId?: number;
  periodsPerWeek?: number;
  isActive?: boolean;
}

export interface ClassTeacherAssignmentModel {
  assignmentId?: number;
  organizationId?: number;
  academicYearId?: number;
  classId?: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  teacherId?: number;
  teacherName?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive?: boolean;
  notes?: string;
}

export interface TimetableSlotModel {
  slotId?: number;
  organizationId?: number;
  academicYearId?: number;
  classId?: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  subjectId?: number;
  subjectName?: string;
  teacherId?: number;
  teacherName?: string;
  dayOfWeek?: string;
  periodNumber?: number;
  startTime?: string;
  endTime?: string;
  roomName?: string;
  isActive?: boolean;
}

export interface AcademicCalendarEventModel {
  eventId?: number;
  organizationId?: number;
  academicYearId?: number;
  title?: string;
  eventType?: 'HOLIDAY' | 'EXAM' | 'MEETING' | 'EVENT' | 'VACATION' | 'DEADLINE' | 'OTHER';
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  isActive?: boolean;
  description?: string;
}

export interface AcademicSettingModel {
  settingId?: number;
  organizationId?: number;
  settingKey?: string;
  settingValue?: string;
  valueType?: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'JSON' | 'DATE';
  category?: string;
  isActive?: boolean;
  description?: string;
}

export interface SyllabusTopicModel {
  topicNumber?: number;
  topicName?: string;
  description?: string;
  estimatedHours?: number;
}

export interface SyllabusChapterModel {
  chapterNumber?: number;
  chapterName?: string;
  description?: string;
  learningObjectives?: string;
  topics?: SyllabusTopicModel[];
}

export interface SyllabusModel {
  syllabusId?: number;
  syllabusCode?: string;
  title?: string;
  description?: string;
  version?: string;
  status?: string;
  subjectName?: string;
  academicYear?: string;
  chapters?: SyllabusChapterModel[];
  approvedDate?: string;
  publishedDate?: string;
}

export interface AcademicsWorkspaceData {
  academicYears: AcademicYear[];
  currentYear: AcademicYear | null;
  classes: AcademicClass[];
  sections: AcademicSection[];
  courses: CourseModel[];
  subjects: SubjectModel[];
  containers: AcademicContainerModel[];
  staff: StaffModel[];
  teacherAllocations: TeacherAllocationModel[];
  classTeacherAssignments: ClassTeacherAssignmentModel[];
  timetableSlots: TimetableSlotModel[];
  calendarEvents: AcademicCalendarEventModel[];
  academicSettings: AcademicSettingModel[];
  syllabi: SyllabusModel[];
}

export interface WorkspaceKpi {
  label: string;
  value: string | number;
  hint: string;
  icon: string;
  tone: AcademicsTone;
}

export interface WorkspaceCard {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  meta: string;
  status: string;
  progress: number;
  icon: string;
  tone: AcademicsTone;
  entity: AcademicYear | AcademicClass | AcademicSection | CourseModel | SubjectModel | AcademicContainerModel | StaffModel | ClassTeacherAssignmentModel | TimetableSlotModel | AcademicCalendarEventModel | AcademicSettingModel;
}

export interface WorkspaceActivity {
  icon: string;
  title: string;
  detail: string;
  tone: AcademicsTone;
}

export interface AcademicsNavGroup {
  label: string;
  icon: string;
  pages: AcademicsWorkspacePage[];
}

export interface AcademicsQuickAction {
  id: string;
  label: string;
  helper: string;
  icon: string;
  tone: AcademicsTone;
  actionMode: AcademicsActionMode;
  pages: AcademicsWorkspacePage[];
}

export interface AcademicsMetric {
  label: string;
  value: string | number;
  helper: string;
  icon: string;
  tone: AcademicsTone;
  progress?: number;
  trend?: string;
}

export interface AcademicsInsight {
  title: string;
  description: string;
  value?: string | number;
  tone: AcademicsTone;
  icon: string;
  progress?: number;
}

export interface AcademicsAlert {
  title: string;
  description: string;
  tone: AcademicsTone;
  icon: string;
}

export interface AcademicsActivityItem {
  title: string;
  description: string;
  meta: string;
  icon: string;
  tone: AcademicsTone;
}

export interface AcademicsChartSlice {
  label: string;
  value: number;
  tone: AcademicsTone;
}

export interface AcademicsWorkloadItem {
  teacherId?: number;
  teacherName: string;
  totalPeriods: number;
  allocationCount: number;
  utilization: number;
  tone: AcademicsTone;
}
