import { SubjectCategory } from '../../core/enums/subject-category.enum';

export interface Course {
    courseId?: number;
    courseCode: string;
    courseName: string;
    description?: string;
    organisationId?: number;
    category?: string;
    durationYears?: number;
    totalSemesters?: number;
    eligibilityCriteria?: string;
    fees?: number;
    isActive?: boolean;
}

export interface Subject {
    subjectId?: number;
    subjectCode: string;
    subjectName: string;
    description?: string;
    organisationId?: number;
    category?: string;
    credits?: number;
    theoryHours?: number;
    labHours?: number;
    practicalHours?: number;
    isActive?: boolean;
}

export interface AcademicYear {
    academicYearId?: number;
    id?: number;
    organizationId?: number;
    yearCode: string;
    yearName?: string;
    startDate: string;
    endDate: string;
    isCurrent?: boolean;
    isActive: boolean;
}

export interface SubjectContainerMapping {
    id?: number;
    subjectId: number;
    subjectName?: string;
    containerId: number;
    academicYearId: number;
    semester?: number; // 1, 2, 3...
    isMandatory: boolean;
    credits?: number; // Override default subject credits if needed
    hoursPerWeek?: number;
}

