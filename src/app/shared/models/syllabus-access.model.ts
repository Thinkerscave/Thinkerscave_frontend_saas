export interface SyllabusAccess {
    id?: number;
    userId: number;
    syllabusId: number;
    firstAccessedDate: string;
    lastAccessedDate: string;
    viewCount: number;
    totalTimeSpentMinutes: number;
    accessType: 'STUDENT' | 'PARENT' | 'TEACHER'; // or use an Enum if strict
    deviceType: string;
}
