import { SubjectCategory } from '../../core/enums/subject-category.enum';

export interface Course {
    id?: number;
    name: string;
    code: string;
    description?: string;
    organisationId: number;
}

export interface Subject {
    id?: number;
    name: string;
    code: string;
    category: SubjectCategory;
    description?: string;
}

export interface AcademicYear {
    id?: number;
    name: string; // e.g. "2024-2025"
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface SubjectContainerMapping {
    id?: number;
    subjectId: number;
    subjectName?: string; // Optional helper
    containerId: number;
    academicYearId: number;
    semester?: number;
    year?: number;
    isMandatory: boolean;
    credits?: number;
    hoursPerWeek?: number;
}
