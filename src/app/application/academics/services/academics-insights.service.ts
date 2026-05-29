import { Injectable } from '@angular/core';
import {
  AcademicClass,
  AcademicSection,
  AcademicsActivityItem,
  AcademicsAlert,
  AcademicsChartSlice,
  AcademicsInsight,
  AcademicsMetric,
  AcademicsTone,
  AcademicsWorkloadItem,
  AcademicsWorkspaceData,
  StaffModel,
  SubjectModel,
  TeacherAllocationModel,
  TimetableSlotModel
} from '../models/academics-workspace.model';

@Injectable({ providedIn: 'root' })
export class AcademicsInsightsService {
  metrics(data: AcademicsWorkspaceData): AcademicsMetric[] {
    const classCount = data.classes.length;
    const sectionCount = data.sections.length;
    const subjectCount = data.subjects.length;
    const teacherCount = data.staff.length;
    const allocationCoverage = this.percent(data.teacherAllocations.length, Math.max(subjectCount, 1) * Math.max(classCount, 1));
    const timetableCoverage = this.percent(data.timetableSlots.length, Math.max(classCount * 6, 1));
    const syllabusCoverage = this.percent(data.syllabi.length, Math.max(subjectCount, 1));
    const classTeacherCoverage = this.percent(data.classTeacherAssignments.length, Math.max(classCount, 1));

    return [
      { label: 'Academic health', value: `${this.academicHealth(data)}%`, helper: 'Readiness across structure, delivery and planning', icon: 'pi pi-sparkles', tone: 'primary', progress: this.academicHealth(data), trend: 'Live' },
      { label: 'Classes', value: classCount, helper: `${sectionCount} sections configured`, icon: 'pi pi-sitemap', tone: 'info', progress: this.percent(sectionCount, Math.max(classCount * 2, 1)) },
      { label: 'Subject coverage', value: `${syllabusCoverage}%`, helper: `${data.syllabi.length} subjects have published syllabi`, icon: 'pi pi-book', tone: 'success', progress: syllabusCoverage },
      { label: 'Teacher workload', value: teacherCount, helper: `${data.teacherAllocations.length} active subject allocations`, icon: 'pi pi-users', tone: 'primary', progress: allocationCoverage },
      { label: 'Timetable coverage', value: `${timetableCoverage}%`, helper: `${data.timetableSlots.length} periods placed this year`, icon: 'pi pi-clock', tone: 'warning', progress: timetableCoverage },
      { label: 'Class ownership', value: `${classTeacherCoverage}%`, helper: `${data.classTeacherAssignments.length} homeroom assignments active`, icon: 'pi pi-user-plus', tone: 'success', progress: classTeacherCoverage }
    ];
  }

  insights(data: AcademicsWorkspaceData): AcademicsInsight[] {
    const totalCapacity = data.containers.reduce((sum, item) => sum + (item.capacity ?? 0), 0);
    const totalStrength = data.containers.reduce((sum, item) => sum + (item.currentStrength ?? 0), 0);
    const capacityUsage = totalCapacity ? this.percent(totalStrength, totalCapacity) : 0;
    const averageWorkload = this.workloads(data).length
      ? Math.round(this.workloads(data).reduce((sum, item) => sum + item.totalPeriods, 0) / this.workloads(data).length)
      : 0;

    return [
      { title: 'Curriculum readiness', description: `${data.syllabi.length} live syllabi mapped to the current academic year.`, value: `${this.percent(data.syllabi.length, Math.max(data.subjects.length, 1))}%`, tone: 'success', icon: 'pi pi-list-check', progress: this.percent(data.syllabi.length, Math.max(data.subjects.length, 1)) },
      { title: 'Teacher balance', description: `Average weekly load is ${averageWorkload} periods per teacher.`, value: averageWorkload, tone: averageWorkload > 24 ? 'danger' : averageWorkload > 16 ? 'warning' : 'primary', icon: 'pi pi-chart-bar', progress: this.percent(averageWorkload, 30) },
      { title: 'Capacity signal', description: `${totalStrength || data.sections.length} learners/sections represented across hierarchy nodes.`, value: `${capacityUsage}%`, tone: capacityUsage > 90 ? 'danger' : capacityUsage > 75 ? 'warning' : 'info', icon: 'pi pi-building', progress: capacityUsage },
      { title: 'Planning activity', description: `${data.calendarEvents.length} academic events and ${data.timetableSlots.length} timetable slots are scheduled.`, value: data.calendarEvents.length + data.timetableSlots.length, tone: 'primary', icon: 'pi pi-calendar', progress: this.percent(data.calendarEvents.length + data.timetableSlots.length, 24) }
    ];
  }

  alerts(data: AcademicsWorkspaceData): AcademicsAlert[] {
    const alerts: AcademicsAlert[] = [];
    const unassignedClasses = Math.max(data.classes.length - data.classTeacherAssignments.length, 0);
    const subjectsWithoutSyllabus = Math.max(data.subjects.length - data.syllabi.length, 0);
    const classesWithoutTimetable = data.classes.filter(item => !data.timetableSlots.some(slot => Number(slot.classId) === Number(item.classId))).length;

    if (unassignedClasses > 0) {
      alerts.push({ title: `${unassignedClasses} classes need ownership`, description: 'Assign class teachers so parents and students have a clear homeroom contact.', tone: 'warning', icon: 'pi pi-user-plus' });
    }

    if (subjectsWithoutSyllabus > 0) {
      alerts.push({ title: `${subjectsWithoutSyllabus} subjects need syllabus mapping`, description: 'Create or publish syllabus records to improve delivery tracking.', tone: 'info', icon: 'pi pi-book' });
    }

    if (classesWithoutTimetable > 0) {
      alerts.push({ title: `${classesWithoutTimetable} classes need timetable coverage`, description: 'Add weekly periods so operations can detect teacher and room conflicts earlier.', tone: 'danger', icon: 'pi pi-clock' });
    }

    if (!alerts.length) {
      alerts.push({ title: 'Academic workspace is ready', description: 'Core structure, teacher ownership and planning data are available for the active year.', tone: 'success', icon: 'pi pi-check-circle' });
    }

    return alerts;
  }

  activities(data: AcademicsWorkspaceData): AcademicsActivityItem[] {
    const eventActivities = data.calendarEvents.slice(0, 3).map(event => ({
      title: event.title || 'Academic event',
      description: `${event.eventType || 'EVENT'} scheduled from ${event.startDate || 'date pending'}`,
      meta: event.endDate || event.startDate || 'Calendar',
      icon: 'pi pi-calendar',
      tone: this.eventTone(event.eventType) as AcademicsTone
    }));

    const timetableActivities = data.timetableSlots.slice(0, 3).map(slot => ({
      title: `${slot.subjectName || 'Subject'} placed`,
      description: `${slot.className || 'Class'} ${slot.sectionName || ''} on ${this.formatDay(slot.dayOfWeek)}`.trim(),
      meta: `Period ${slot.periodNumber || '-'}`,
      icon: 'pi pi-clock',
      tone: 'primary' as AcademicsTone
    }));

    const ownerActivities = data.classTeacherAssignments.slice(0, 2).map(item => ({
      title: `${item.teacherName || 'Teacher'} owns ${item.className || 'class'}`,
      description: item.sectionName ? `Section responsibility: ${item.sectionName}` : 'Whole class responsibility',
      meta: item.effectiveFrom || 'Class teacher',
      icon: 'pi pi-user-plus',
      tone: 'success' as AcademicsTone
    }));

    return [...eventActivities, ...timetableActivities, ...ownerActivities].slice(0, 6);
  }

  subjectDistribution(data: AcademicsWorkspaceData): AcademicsChartSlice[] {
    const groups = data.subjects.reduce<Record<string, number>>((acc, subject) => {
      const category = subject.category || 'GENERAL';
      acc[category] = (acc[category] ?? 0) + 1;
      return acc;
    }, {});

    const tones: AcademicsTone[] = ['primary', 'success', 'info', 'warning', 'danger', 'neutral'];
    return Object.entries(groups).map(([label, value], index) => ({ label, value, tone: tones[index % tones.length] }));
  }

  workloads(data: AcademicsWorkspaceData): AcademicsWorkloadItem[] {
    const staff = data.staff.length ? data.staff : this.staffFromAllocations(data.teacherAllocations);
    return staff.map(teacher => {
      const teacherId = this.staffId(teacher);
      const allocations = data.teacherAllocations.filter(item => Number(item.teacherId) === Number(teacherId));
      const totalPeriods = allocations.reduce((sum, item) => sum + (item.periodsPerWeek ?? 0), 0);
      const utilization = this.percent(totalPeriods, 30);
      return {
        teacherId,
        teacherName: this.staffName(teacher),
        totalPeriods,
        allocationCount: allocations.length,
        utilization,
        tone: utilization > 85 ? 'danger' : utilization > 65 ? 'warning' : 'success'
      };
    });
  }

  classStrength(classItem: AcademicClass, sections: AcademicSection[]): number {
    return sections.filter(section => Number(section.classId ?? section.classEntity?.classId) === Number(classItem.classId)).length;
  }

  slotsFor(data: AcademicsWorkspaceData, day: string, periodNumber: number): TimetableSlotModel[] {
    return data.timetableSlots.filter(slot => slot.dayOfWeek === day && slot.periodNumber === periodNumber);
  }

  teacherNameFromId(data: AcademicsWorkspaceData, teacherId?: number): string {
    const staff = data.staff.find(item => Number(this.staffId(item)) === Number(teacherId));
    return staff ? this.staffName(staff) : 'Select teacher';
  }

  subjectNameFromId(data: AcademicsWorkspaceData, subjectId?: number): string {
    return data.subjects.find(item => Number(item.subjectId) === Number(subjectId))?.subjectName ?? 'Select subject';
  }

  classNameFromId(data: AcademicsWorkspaceData, classId?: number | string): string {
    return data.classes.find(item => Number(item.classId) === Number(classId))?.className ?? 'Select class';
  }

  staffName(staff: StaffModel): string {
    return [staff.firstName, staff.middleName, staff.lastName].filter(Boolean).join(' ') || staff.staffCode || 'Teacher';
  }

  staffId(staff: StaffModel): number | undefined {
    const id = Number(staff.staffId ?? staff.id);
    return Number.isFinite(id) ? id : undefined;
  }

  formatDay(day?: string): string {
    if (!day) {
      return 'Day pending';
    }

    return day.charAt(0).toUpperCase() + day.slice(1).toLowerCase();
  }

  percent(value: number, total: number): number {
    if (!Number.isFinite(value) || !Number.isFinite(total) || total <= 0) {
      return 0;
    }

    return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
  }

  academicHealth(data: AcademicsWorkspaceData): number {
    const signals = [
      this.percent(data.classes.length, 6),
      this.percent(data.sections.length, Math.max(data.classes.length * 2, 1)),
      this.percent(data.syllabi.length, Math.max(data.subjects.length, 1)),
      this.percent(data.teacherAllocations.length, Math.max(data.subjects.length, 1)),
      this.percent(data.classTeacherAssignments.length, Math.max(data.classes.length, 1)),
      this.percent(data.timetableSlots.length, Math.max(data.classes.length * 4, 1)),
      this.percent(data.calendarEvents.length, 6)
    ];

    return Math.round(signals.reduce((sum, signal) => sum + signal, 0) / signals.length);
  }

  private eventTone(type?: string): AcademicsTone {
    switch (type) {
      case 'EXAM':
        return 'danger';
      case 'HOLIDAY':
      case 'VACATION':
        return 'success';
      case 'MEETING':
        return 'warning';
      case 'DEADLINE':
        return 'info';
      default:
        return 'primary';
    }
  }

  private staffFromAllocations(allocations: TeacherAllocationModel[]): StaffModel[] {
    const map = new Map<number, StaffModel>();
    allocations.forEach(allocation => {
      const teacherId = Number(allocation.teacherId);
      if (!Number.isFinite(teacherId) || map.has(teacherId)) {
        return;
      }

      const parts = (allocation.teacherName || 'Teacher').split(' ');
      map.set(teacherId, { staffId: teacherId, firstName: parts[0], lastName: parts.slice(1).join(' ') });
    });

    return Array.from(map.values());
  }
}
