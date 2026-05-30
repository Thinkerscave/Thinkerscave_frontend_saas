import { Component, Input, OnInit, OnChanges, SimpleChanges , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { ToastModule } from 'primeng/toast';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { Semester } from '../../../../shared/models/semester.model';
import { SemesterService } from '../../services/semester.service';
import { StandardListViewComponent } from '../../../../shared/components/standard-list-view/standard-list-view.component';
import { ListViewConfig } from '../../../../shared/components/standard-list-view/list-view-models';
import { LoginService } from '../../../../core/services/login.service';
import { AutofocusDirective } from '../../../../shared/directives';

@Component({
    selector: 'app-semester-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        CalendarModule,
        ToastModule,
        ConfirmDialogModule,
        StandardListViewComponent,
        AutofocusDirective
    ],
    providers: [MessageService, ConfirmationService],
    templateUrl: './semester-list.component.html',
    styleUrls: ['./semester-list.component.scss']
})
export class SemesterListComponent implements OnInit, OnChanges {
    @Input() academicYearId!: number;
    @Input() academicYearName!: string;

    semesters: Semester[] = [];
    semesterDialog: boolean = false;
    semesterForm: FormGroup;
    submitted: boolean = false;
    loading: boolean = false;

    constructor(
        private semesterService: SemesterService,
        private fb: FormBuilder,
        private messageService: MessageService,
        private confirmationService: ConfirmationService,
        private loginService: LoginService
    ) {
        this.semesterForm = this.fb.group({
            semesterId: [null],
            semesterName: ['', Validators.required],
            semesterCode: ['', Validators.required],
            academicYearId: [null],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            isActive: [true]
        });
    }

    get listViewConfig(): ListViewConfig {
        return {
            title: `Semesters for ${this.academicYearName}`,
            isClientSide: true,
            showSearch: true,
            searchPlaceholder: 'Search semesters...',
            loading: this.loading,
            primaryAction: {
                label: 'Add Semester',
                icon: 'pi pi-plus',
                visibleFn: () => this.loginService.getUserPrivileges().includes('ACADEMIC_STRUCTURE_ADD'),
                actionFn: () => this.openNew()
            },
            columns: [
                { field: 'semesterName', header: 'Name', type: 'text', sortable: true },
                { field: 'semesterCode', header: 'Code', type: 'text', sortable: true },
                { field: 'startDate', header: 'Start Date', type: 'date', sortable: true },
                { field: 'endDate', header: 'End Date', type: 'date', sortable: true }
            ],
            rowActions: [
                {
                    label: 'Edit',
                    icon: 'pi pi-pencil',
                    isPrimary: true,
                    visibleFn: () => this.loginService.getUserPrivileges().includes('ACADEMIC_STRUCTURE_EDIT'),
                    actionFn: (sem) => this.editSemester(sem)
                },
                {
                    label: 'Delete',
                    icon: 'pi pi-trash',
                    isPrimary: true,
                    color: 'danger',
                    visibleFn: () => this.loginService.getUserPrivileges().includes('ACADEMIC_STRUCTURE_DELETE'),
                    actionFn: (sem) => this.deleteSemester(sem)
                }
            ]
        };
    }

    ngOnInit(): void { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['academicYearId'] && this.academicYearId) {
            this.loadSemesters();
        }
    }

    loadSemesters() {
        this.loading = true;
        this.semesterService.getSemestersByYear(this.academicYearId).subscribe({
            next: (data) => {
                this.semesters = data;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    openNew() {
        this.semesterForm.reset({ isActive: true });
        this.submitted = false;
        this.semesterDialog = true;
    }

    editSemester(semester: Semester) {
        this.semesterForm.patchValue({
            ...semester,
            startDate: semester.startDate ? new Date(semester.startDate) : null,
            endDate: semester.endDate ? new Date(semester.endDate) : null
        });
        this.semesterDialog = true;
    }

    deleteSemester(semester: Semester) {
        this.confirmationService.confirm({
            message: 'Are you sure you want to delete ' + semester.semesterName + '?',
            header: 'Confirm',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                if (semester.semesterId) {
                    this.semesterService.deleteSemester(semester.semesterId).subscribe(() => {
                        this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Semester Deleted', life: 3000 });
                        this.loadSemesters();
                    });
                }
            }
        });
    }

    saveSemester() {
        this.submitted = true;

        if (this.semesterForm.valid) {
            const formValue = this.semesterForm.value;
            const payload: Semester = {
                ...formValue,
                academicYearId: this.academicYearId,
                startDate: this.formatDate(formValue.startDate),
                endDate: this.formatDate(formValue.endDate)
            };

            if (payload.semesterId) {
                this.semesterService.updateSemester(payload.semesterId, payload).subscribe(() => {
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Semester Updated', life: 3000 });
                    this.semesterDialog = false;
                    this.loadSemesters();
                });
            } else {
                this.semesterService.createSemester(payload).subscribe(() => {
                    this.messageService.add({ severity: 'success', summary: 'Successful', detail: 'Semester Created', life: 3000 });
                    this.semesterDialog = false;
                    this.loadSemesters();
                });
            }
        }
    }

    hideDialog() {
        this.semesterDialog = false;
        this.submitted = false;
    }

    // Helper to format Date object to YYYY-MM-DD
    private formatDate(date: Date | string): string {
        if (!date) return '';
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        const year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    }
}
