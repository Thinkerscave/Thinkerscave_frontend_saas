import { SyllabusStatus } from '../../core/enums/syllabus-status.enum';

export interface Topic {
    id?: number;
    name: string;
    description?: string;
    estimatedMinutes?: number;
    sequenceOrder: number;
}

export interface Chapter {
    id?: number;
    name: string;
    description?: string;
    sequenceOrder: number;
    topics: Topic[];
}

export interface Syllabus {
    id?: number;
    syllabusCode: string;
    subjectId: number;
    courseId: number; // or mappingId
    academicYearId: number;
    version: string;
    status: SyllabusStatus;
    previousVersionId?: number;

    // Approval Workflow
    approvedById?: number;
    approvedDate?: string; // ISO Date
    publishedDate?: string;
    archivedDate?: string;
    approvalRemarks?: string;

    chapters: Chapter[];
}
