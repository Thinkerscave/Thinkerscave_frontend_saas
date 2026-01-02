import { ProgressStatus } from '../../core/enums/progress-status.enum';

export interface SyllabusProgress {
    id?: number;
    studentId: number;
    subjectId: number;
    syllabusId: number;
    chapterId?: number;
    topicId?: number;
    status: ProgressStatus;
    completionPercentage: number;
    startedDate?: string;
    completedDate?: string;
    timeSpentMinutes: number;
    notes?: string;
}
