export interface Semester {
    semesterId?: number;
    semesterName: string; // e.g. "Semester 1", "Fall 2024"
    semesterCode: string; // e.g. "S1", "FALL24"
    academicYearId: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
    description?: string;
}
