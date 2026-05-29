import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ACADEMICS_DAY_OPTIONS, ACADEMICS_EVENT_TYPES, ACADEMICS_PERIODS, actionModeLabel } from '../../../data/academics-workspace.config';
import {
  AcademicSection,
  AcademicsActionMode,
  AcademicsWorkspaceData,
  StaffModel
} from '../../../models/academics-workspace.model';
import { AcademicsInsightsService } from '../../../services/academics-insights.service';

@Component({
  selector: 'app-academic-action-drawer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './academic-action-drawer.component.html'
})
export class AcademicActionDrawerComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly insights = inject(AcademicsInsightsService);

  @Input() open = false;
  @Input() mode: AcademicsActionMode = 'class';
  @Input() data: AcademicsWorkspaceData | null = null;
  @Input() saving = false;
  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<{ mode: AcademicsActionMode; payload: Record<string, unknown> }>();

  readonly days = ACADEMICS_DAY_OPTIONS;
  readonly periods = ACADEMICS_PERIODS;
  readonly eventTypes = ACADEMICS_EVENT_TYPES;

  readonly yearForm = this.fb.nonNullable.group({
    yearCode: ['AY-2026-27', [Validators.required]],
    startDate: ['2026-04-01', [Validators.required]],
    endDate: ['2027-03-31', [Validators.required]]
  });

  readonly classForm = this.fb.nonNullable.group({
    className: ['', [Validators.required, Validators.minLength(2)]]
  });

  readonly sectionForm = this.fb.nonNullable.group({
    classId: [0, [Validators.required, Validators.min(1)]],
    sectionName: ['', [Validators.required, Validators.minLength(1)]]
  });

  readonly subjectForm = this.fb.nonNullable.group({
    subjectCode: ['', [Validators.required, Validators.minLength(2)]],
    subjectName: ['', [Validators.required, Validators.minLength(2)]],
    category: ['CORE', [Validators.required]],
    credits: [4, [Validators.required, Validators.min(0)]],
    theoryHours: [3, [Validators.required, Validators.min(0)]],
    labHours: [0, [Validators.required, Validators.min(0)]],
    practicalHours: [0, [Validators.required, Validators.min(0)]],
    description: ['']
  });

  readonly allocationForm = this.fb.nonNullable.group({
    classId: [0, [Validators.required, Validators.min(1)]],
    sectionId: [0],
    subjectId: [0, [Validators.required, Validators.min(1)]],
    teacherId: [0, [Validators.required, Validators.min(1)]],
    periodsPerWeek: [5, [Validators.required, Validators.min(1), Validators.max(40)]]
  });

  readonly classTeacherForm = this.fb.nonNullable.group({
    classId: [0, [Validators.required, Validators.min(1)]],
    sectionId: [0],
    teacherId: [0, [Validators.required, Validators.min(1)]],
    effectiveFrom: ['2026-04-01'],
    notes: ['']
  });

  readonly timetableForm = this.fb.nonNullable.group({
    classId: [0, [Validators.required, Validators.min(1)]],
    sectionId: [0],
    subjectId: [0, [Validators.required, Validators.min(1)]],
    teacherId: [0, [Validators.required, Validators.min(1)]],
    dayOfWeek: ['MONDAY', [Validators.required]],
    periodNumber: [1, [Validators.required, Validators.min(1)]],
    startTime: ['08:30', [Validators.required]],
    endTime: ['09:15', [Validators.required]],
    roomName: ['']
  });

  readonly calendarForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    eventType: ['EVENT', [Validators.required]],
    startDate: ['2026-06-15', [Validators.required]],
    endDate: ['2026-06-15', [Validators.required]],
    description: ['']
  });

  readonly settingsForm = this.fb.nonNullable.group({
    settingKey: ['MAX_PERIODS_PER_DAY', [Validators.required]],
    settingValue: ['8', [Validators.required]],
    valueType: ['NUMBER', [Validators.required]],
    category: ['TIMETABLE', [Validators.required]],
    description: ['Maximum teaching periods allowed in a school day.']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] || changes['mode'] || changes['open']) {
      this.applyDefaults();
    }
  }

  get title(): string {
    return actionModeLabel(this.mode);
  }

  get activeForm(): FormGroup {
    switch (this.mode) {
      case 'year':
        return this.yearForm;
      case 'class':
        return this.classForm;
      case 'section':
        return this.sectionForm;
      case 'subject':
        return this.subjectForm;
      case 'allocation':
        return this.allocationForm;
      case 'class-teacher':
        return this.classTeacherForm;
      case 'timetable':
        return this.timetableForm;
      case 'calendar-event':
        return this.calendarForm;
      case 'settings':
        return this.settingsForm;
    }
  }

  get sectionsForSelectedClass(): AcademicSection[] {
    const classId = Number(this.activeForm.get('classId')?.value ?? 0);
    return this.data?.sections.filter(section => Number(section.classId ?? section.classEntity?.classId) === classId) ?? [];
  }

  teacherLabel(staff: StaffModel): string {
    return this.insights.staffName(staff);
  }

  submit(): void {
    if (this.activeForm.invalid || this.saving) {
      this.activeForm.markAllAsTouched();
      return;
    }

    const payload = this.payloadForMode();
    this.submitted.emit({ mode: this.mode, payload });
  }

  private applyDefaults(): void {
    if (!this.data) {
      return;
    }

    const classId = this.firstUnownedClassId() ?? this.firstClassId();
    const sectionId = this.firstSectionId(classId) ?? 0;
    const subjectId = this.firstSubjectId();
    const teacherId = this.firstAvailableTeacherId() ?? this.firstTeacherId();
    const currentStart = this.data.currentYear?.startDate ?? '2026-04-01';

    this.sectionForm.patchValue({ classId, sectionName: this.nextSectionName(classId) }, { emitEvent: false });
    this.allocationForm.patchValue({ classId, sectionId, subjectId, teacherId }, { emitEvent: false });
    this.classTeacherForm.patchValue({ classId, sectionId: 0, teacherId, effectiveFrom: currentStart }, { emitEvent: false });
    this.timetableForm.patchValue({ classId, sectionId, subjectId, teacherId }, { emitEvent: false });

    const firstSetting = this.data.academicSettings[0];
    if (firstSetting) {
      this.settingsForm.patchValue({
        settingKey: firstSetting.settingKey || 'MAX_PERIODS_PER_DAY',
        settingValue: firstSetting.settingValue || '8',
        valueType: firstSetting.valueType || 'NUMBER',
        category: firstSetting.category || 'TIMETABLE',
        description: firstSetting.description || ''
      }, { emitEvent: false });
    }
  }

  private payloadForMode(): Record<string, unknown> {
    const yearId = this.currentYearId();

    switch (this.mode) {
      case 'year':
        return this.yearForm.getRawValue();
      case 'class':
        return this.classForm.getRawValue();
      case 'section': {
        const value = this.sectionForm.getRawValue();
        return { classId: Number(value.classId), sectionName: value.sectionName };
      }
      case 'subject':
        return this.subjectForm.getRawValue();
      case 'allocation': {
        const value = this.allocationForm.getRawValue();
        return { ...value, classId: Number(value.classId), sectionId: this.optionalNumber(value.sectionId), subjectId: Number(value.subjectId), teacherId: Number(value.teacherId), academicYearId: yearId };
      }
      case 'class-teacher': {
        const value = this.classTeacherForm.getRawValue();
        return { ...value, classId: Number(value.classId), sectionId: this.optionalNumber(value.sectionId), teacherId: Number(value.teacherId), academicYearId: yearId };
      }
      case 'timetable': {
        const value = this.timetableForm.getRawValue();
        return { ...value, classId: Number(value.classId), sectionId: this.optionalNumber(value.sectionId), subjectId: Number(value.subjectId), teacherId: Number(value.teacherId), periodNumber: Number(value.periodNumber), academicYearId: yearId };
      }
      case 'calendar-event':
        return { ...this.calendarForm.getRawValue(), academicYearId: yearId, allDay: true };
      case 'settings':
        return this.settingsForm.getRawValue();
    }
  }

  private firstClassId(): number {
    return Number(this.data?.classes[0]?.classId ?? 0);
  }

  private firstSubjectId(): number {
    return Number(this.data?.subjects[0]?.subjectId ?? 0);
  }

  private firstTeacherId(): number {
    const teacher = this.data?.staff[0];
    return Number(teacher?.staffId ?? teacher?.id ?? 0);
  }

  private firstUnownedClassId(): number | undefined {
    const classItem = this.data?.classes.find(item => !this.data?.classTeacherAssignments.some(assignment => Number(assignment.classId) === Number(item.classId)));
    const classId = Number(classItem?.classId);
    return Number.isFinite(classId) && classId > 0 ? classId : undefined;
  }

  private firstAvailableTeacherId(): number | undefined {
    const teacher = this.data?.staff.find(staff => !this.data?.classTeacherAssignments.some(assignment => Number(assignment.teacherId) === Number(staff.staffId ?? staff.id)));
    const teacherId = Number(teacher?.staffId ?? teacher?.id);
    return Number.isFinite(teacherId) && teacherId > 0 ? teacherId : undefined;
  }

  private firstSectionId(classId: number): number | undefined {
    const section = this.data?.sections.find(item => Number(item.classId ?? item.classEntity?.classId) === Number(classId));
    const sectionId = Number(section?.sectionId);
    return Number.isFinite(sectionId) && sectionId > 0 ? sectionId : undefined;
  }

  private nextSectionName(classId: number): string {
    const count = this.data?.sections.filter(section => Number(section.classId ?? section.classEntity?.classId) === Number(classId)).length ?? 0;
    return `Section ${String.fromCharCode(65 + count)}`;
  }

  private currentYearId(): number | undefined {
    const yearId = Number(this.data?.currentYear?.academicYearId ?? this.data?.currentYear?.id);
    return Number.isFinite(yearId) && yearId > 0 ? yearId : undefined;
  }

  private optionalNumber(value: number | string | null | undefined): number | undefined {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : undefined;
  }
}
