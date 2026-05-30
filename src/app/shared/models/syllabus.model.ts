import { SyllabusStatus } from '../../core/enums/syllabus-status.enum';

export interface Topic {
    id?: number;
    topicId?: number;
    name: string;
    topicName?: string;
    description?: string;
    estimatedMinutes?: number;
    estimatedHours?: number;
    sequenceOrder: number;
    topicNumber?: number;
}

export interface Chapter {
    id?: number;
    chapterId?: number;
    name: string;
    chapterName?: string;
    description?: string;
    sequenceOrder: number;
    chapterNumber?: number;
    topics: Topic[];
}

export interface Syllabus {
    id?: number;
    syllabusId?: number;
    syllabusCode: string;
    title?: string;
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
