import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { attendanceApi } from '../shared/constants/api.endpoint';

export interface AttendanceRecord {
    id?: number;
    organizationId?: number;
    attendanceType: 'CLASS' | 'STAFF' | 'HOSTEL';
    referenceId?: number;
    referenceName: string;
    attendanceDate: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'WFH' | 'ON_LEAVE' | 'NIGHT_OUT';
    classId?: number;
    className?: string;
    sectionName?: string;
    shift?: string;
    department?: string;
    roomNumber?: string;
    remarks?: string;
    markedBy?: string;
    createdAt?: string;
}

@Injectable({ providedIn: 'root' })
export class AttendanceService {
    constructor(private http: HttpClient) { }

    getByDateAndType(date: string, type: 'CLASS' | 'STAFF' | 'HOSTEL'): Observable<AttendanceRecord[]> {
        return this.http.get<AttendanceRecord[]>(attendanceApi.byDateAndType(date, type));
    }

    getByClass(classId: number, date: string): Observable<AttendanceRecord[]> {
        return this.http.get<AttendanceRecord[]>(attendanceApi.byClass(classId, date));
    }

    getHistory(referenceId: number, type: 'CLASS' | 'STAFF' | 'HOSTEL'): Observable<AttendanceRecord[]> {
        return this.http.get<AttendanceRecord[]>(attendanceApi.history(referenceId, type));
    }

    save(record: AttendanceRecord): Observable<AttendanceRecord> {
        return this.http.post<AttendanceRecord>(attendanceApi.base, record);
    }

    update(id: number, record: Partial<AttendanceRecord>): Observable<AttendanceRecord> {
        return this.http.put<AttendanceRecord>(attendanceApi.update(id), record);
    }

    delete(id: number): Observable<void> {
        return this.http.delete<void>(attendanceApi.delete(id));
    }

    /** Convenience: Get today's class attendance */
    getTodayClassAttendance(): Observable<AttendanceRecord[]> {
        const today = new Date().toISOString().split('T')[0];
        return this.getByDateAndType(today, 'CLASS');
    }

    /** Convenience: Get today's staff attendance */
    getTodayStaffAttendance(): Observable<AttendanceRecord[]> {
        const today = new Date().toISOString().split('T')[0];
        return this.getByDateAndType(today, 'STAFF');
    }

    /** Convenience: Get today's hostel attendance */
    getTodayHostelAttendance(): Observable<AttendanceRecord[]> {
        const today = new Date().toISOString().split('T')[0];
        return this.getByDateAndType(today, 'HOSTEL');
    }
}
