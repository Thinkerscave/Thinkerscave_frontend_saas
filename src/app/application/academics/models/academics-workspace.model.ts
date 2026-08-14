export type AcademicsWorkspacePage =
  | 'academic-year'
  | 'classes-sections'
  | 'subjects-mapping'
  | 'timetable'
  | 'teacher-arrangement'
  | 'calendar'
  | 'syllabus';

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

export type AcademicsActionMode = 'year' | 'class' | 'section' | 'subject' | 'allocation' | 'class-teacher' | 'timetable' | 'calendar-event' | 'settings' | 'shift' | 'template' | 'teacher-absence' | 'syllabus-progress';

export type AcademicsTone = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

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
  displayOrder?: number;
  academicStage?: string;
  isActive?: boolean;
}

export interface AcademicSection {
  sectionId?: number | string;
  sectionName: string;
  classId?: number | string;
  classEntity?: AcademicClass;
  capacity?: number;
  classTeacher?: string;
  studentCount?: number;
  isActive?: boolean;
}

export interface SubjectModel {
  subjectId?: number;
  subjectCode: string;
  subjectName: string;
  description?: string;
  subjectType?: string;
  category?: string;
  credits?: number;
  theoryHours?: number;
  labHours?: number;
  practicalHours?: number;
  weeklyPeriods?: number;
  applicableLevels?: string;
  isActive?: boolean;
}

export interface StaffModel {
  id?: number;
  staffId?: number;
  staffCode?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
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
  primaryTeacherId?: number;
  primaryTeacherName?: string;
  secondaryTeacherId?: number;
  secondaryTeacherName?: string;
  teacherId?: number;
  teacherName?: string;
  academicYearId?: number;
  periodsPerWeek?: number;
  weeklyLoad?: number;
  effectiveFrom?: string;
  effectiveTo?: string;
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
  eventType?: 'HOLIDAY' | 'EXAM' | 'MEETING' | 'EVENT' | 'VACATION' | 'DEADLINE' | 'OTHER' | 'PTM' | 'ACTIVITY' | 'COMPETITION';
  startDate?: string;
  endDate?: string;
  allDay?: boolean;
  location?: string;
  audience?: string;
  description?: string;
  isActive?: boolean;
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

export interface ShiftModel {
  shiftId?: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  totalPeriods: number;
  isActive?: boolean;
}

export interface PeriodTemplateModel {
  templateId?: number;
  templateName: string;
  shiftId?: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  isBreak?: boolean;
  isActive?: boolean;
}

export interface TeacherAbsenceModel {
  absenceId?: number;
  teacherId?: number;
  teacherName?: string;
  date: string;
  reason: string;
  affectedClasses: string[];
  affectedPeriods: number[];
  suggestedReplacementId?: number;
  suggestedReplacementName?: string;
  confidenceScore?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'OVERRIDDEN';
  approvedById?: number;
  approvedByName?: string;
  notes?: string;
  createdAt?: string;
}

export interface SyllabusTopicModel {
  topicId?: number;
  topicNumber?: number;
  topicName: string;
  description?: string;
  estimatedHours?: number;
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  completedOn?: string;
  remarks?: string;
}

export interface SyllabusChapterModel {
  chapterId?: number;
  chapterNumber?: number;
  chapterName: string;
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
  subjectId?: number;
  subjectName?: string;
  academicYear?: string;
  academicYearId?: number;
  classId?: number;
  className?: string;
  sectionId?: number;
  sectionName?: string;
  units?: SyllabusUnitModel[];
  chapters?: SyllabusChapterModel[];
  approvedDate?: string;
  publishedDate?: string;
}

export interface SyllabusUnitModel {
  unitId?: number;
  unitNumber?: number;
  unitName: string;
  description?: string;
  chapters?: SyllabusChapterModel[];
}

export interface SyllabusProgressModel {
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  pendingTopics: number;
  completionPercentage: number;
}

export interface TimetableConflictModel {
  type: 'TEACHER_CONFLICT' | 'ROOM_CONFLICT' | 'OVERLOAD' | 'UNDERUTILIZED';
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  slotIds: number[];
  suggestion?: string;
}

export interface AcademicsWorkspaceData {
  academicYears: AcademicYear[];
  currentYear: AcademicYear | null;
  classes: AcademicClass[];
  sections: AcademicSection[];
  subjects: SubjectModel[];
  staff: StaffModel[];
  teacherAllocations: TeacherAllocationModel[];
  classTeacherAssignments: ClassTeacherAssignmentModel[];
  timetableSlots: TimetableSlotModel[];
  calendarEvents: AcademicCalendarEventModel[];
  academicSettings: AcademicSettingModel[];
  syllabi: SyllabusModel[];
  shifts: ShiftModel[];
  periodTemplates: PeriodTemplateModel[];
  teacherAbsences: TeacherAbsenceModel[];
  timetableConflicts: TimetableConflictModel[];
  syllabusProgress: SyllabusProgressModel | null;
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