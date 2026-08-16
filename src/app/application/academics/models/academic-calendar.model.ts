export type CalendarEventType =
  | 'HOLIDAY'
  | 'EXAMINATION'
  | 'SCHOOL_EVENT'
  | 'ACADEMIC_EVENT'
  | 'OTHER';

export type CalendarAudienceType = 'EVERYONE' | 'CLASS' | 'SECTION';

export type CalendarEventStatus = 'DRAFT' | 'PUBLISHED' | 'INACTIVE';

export interface CalendarClassRef {
  classId: number;
  name: string;
  code?: string;
}

export interface CalendarSectionRef {
  sectionId: number;
  name: string;
  code?: string;
  className?: string;
}

export interface AcademicCalendarEventDto {
  eventId: number;
  academicYearId: number;
  academicYearName?: string;
  yearReadOnly?: boolean;
  title: string;
  description?: string | null;
  eventType: CalendarEventType;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  audienceType: CalendarAudienceType;
  status: CalendarEventStatus;
  classes?: CalendarClassRef[];
  sections?: CalendarSectionRef[];
  publishedBy?: string | null;
  publishedOn?: string | null;
  createdBy?: string | null;
  createdOn?: string | null;
  updatedBy?: string | null;
  updatedOn?: string | null;
}

export interface AcademicCalendarDashboard {
  academicYearId: number;
  name: string;
  status: string;
  yearReadOnly: boolean;
  eventCount: number;
  holidayCount: number;
  examinationCount: number;
  schoolEventCount: number;
  academicEventCount: number;
  otherCount: number;
  upcoming: AcademicCalendarEventDto[];
  events: AcademicCalendarEventDto[];
}

export interface AcademicCalendarEventRequest {
  academicYearId: number;
  title: string;
  description?: string;
  eventType: CalendarEventType;
  startDate: string;
  endDate: string;
  allDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  location?: string;
  audienceType: CalendarAudienceType;
  classIds?: number[];
  sectionIds?: number[];
  publish?: boolean;
}

export interface CalendarListFilters {
  q?: string;
  eventType?: CalendarEventType | null;
  status?: CalendarEventStatus | null;
  audienceType?: CalendarAudienceType | null;
  from?: string | null;
  to?: string | null;
}

export const ACADEMICS_CALENDAR_RESOURCE = 'ACADEMICS_CALENDAR';

export const CALENDAR_EVENT_TYPE_OPTIONS: { label: string; value: CalendarEventType }[] = [
  { label: 'Holiday', value: 'HOLIDAY' },
  { label: 'Examination', value: 'EXAMINATION' },
  { label: 'School Event', value: 'SCHOOL_EVENT' },
  { label: 'Academic Event', value: 'ACADEMIC_EVENT' },
  { label: 'Other', value: 'OTHER' }
];

export const CALENDAR_STATUS_OPTIONS: { label: string; value: CalendarEventStatus }[] = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Inactive', value: 'INACTIVE' }
];

export const CALENDAR_AUDIENCE_OPTIONS: { label: string; value: CalendarAudienceType }[] = [
  { label: 'Everyone', value: 'EVERYONE' },
  { label: 'Specific Classes', value: 'CLASS' },
  { label: 'Specific Sections', value: 'SECTION' }
];
