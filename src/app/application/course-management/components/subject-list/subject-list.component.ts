import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { TagModule } from 'primeng/tag';
import { TabsModule } from 'primeng/tabs';
import { CourseService } from '../../services/course.service';
import { Subject } from '../../../../shared/models/course.model';
import { SubjectCategory } from '../../../../core/enums/subject-category.enum';
import { LoginService } from '../../../../core/services/login.service';
import { StandardListViewComponent } from '../../../../shared/components/standard-list-view/standard-list-view.component';
import { ListViewConfig } from '../../../../shared/components/standard-list-view/list-view-models';
import { AutofocusDirective } from '../../../../shared/directives';

@Component({
    selector: 'app-subject-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        DialogModule,
        InputTextModule,
        InputTextarea,
        DropdownModule,
        InputNumberModule,
        TagModule,
        TabsModule,
        StandardListViewComponent,
        AutofocusDirective
    ],
    templateUrl: './subject-list.component.html',
    styleUrls: ['./subject-list.component.scss']
})
export class SubjectListComponent implements OnInit {
    subjects: Subject[] = [];
    loading: boolean = true;
    subjectDialog: boolean = false;
    activeTabIndex: number = 1; // Default to View tab
    subject: Subject = this.createEmptySubject();
    addSubjectObj: Subject = this.createEmptySubject();
    submitted: boolean = false;
    orgId: number;

    constructor(
        private courseService: CourseService,
        private loginService: LoginService
    ) {
        this.orgId = this.loginService.getUser()?.organizationId || 1;
    }

    get listViewConfig(): ListViewConfig {
        return {
            title: 'Subject Library',
            isClientSide: true,
            showSearch: true,
            searchPlaceholder: 'Search subjects...',
            loading: this.loading,
            primaryAction: {
                label: 'Create New Subject',
                icon: 'pi pi-plus',
                visibleFn: () => this.loginService.getUserPrivileges().includes('MANAGE_SUBJECTS_ADD'),
                actionFn: () => {
                    this.activeTabIndex = 0; // Switch to Add tab
                    this.addSubjectObj = this.createEmptySubject();
                    this.submitted = false;
                }
            },
            columns: [
                { field: 'subjectCode', header: 'Code', type: 'text', sortable: true },
                { field: 'subjectName', header: 'Subject Name', type: 'text', sortable: true },
                { field: 'category', header: 'Category / Type', type: 'badge', sortable: true, valueGetter: (sub) => sub.category || 'CORE' },
                { field: 'credits', header: 'Credits', type: 'text', sortable: true, valueGetter: (sub) => String(sub.credits || 0) },
                {
                    field: 'hours',
                    header: 'Hours (T-L-P)',
                    type: 'text',
                    valueGetter: (sub) => `${sub.theoryHours || 0} - ${sub.labHours || 0} - ${sub.practicalHours || 0}`
                }
            ],
            rowActions: [
                {
                    label: 'Edit',
                    icon: 'pi pi-pencil',
                    isPrimary: true,
                    visibleFn: () => this.loginService.getUserPrivileges().includes('MANAGE_SUBJECTS_EDIT'),
                    actionFn: (sub) => this.editSubject(sub)
                }
            ]
        };
    }

    ngOnInit(): void {
        this.loadSubjects();
    }

    loadSubjects() {
        this.loading = true;
        this.courseService.getAllSubjectsByOrg(this.orgId).subscribe({
            next: (data: Subject[]) => {
                this.subjects = data;
                this.loading = false;
            },
            error: (err) => {
                console.error(err);
                this.loading = false;
            }
        });
    }

    openNew() {
        this.addSubjectObj = this.createEmptySubject();
        this.submitted = false;
        this.activeTabIndex = 0;
    }

    editSubject(subject: Subject) {
        this.subject = { ...subject };
        this.subjectDialog = true;
    }

    hideDialog() {
        this.subjectDialog = false;
        this.submitted = false;
    }

    saveAddSubject() {
        this.submitted = true;
        if (this.addSubjectObj.subjectName?.trim() && this.addSubjectObj.subjectCode?.trim()) {
            this.courseService.createSubject(this.addSubjectObj).subscribe(() => {
                this.loadSubjects();
                this.addSubjectObj = this.createEmptySubject();
                this.submitted = false;
                this.activeTabIndex = 1; // Return to View tab
            });
        }
    }

    saveEditSubject() {
        this.submitted = true;

        if (this.subject.subjectName?.trim() && this.subject.subjectCode?.trim()) {
            if (this.subject.subjectId) {
                this.courseService.updateSubject(this.subject.subjectId, this.subject).subscribe(() => {
                    this.loadSubjects();
                    this.hideDialog();
                });
            }
        }
    }

    createEmptySubject(): Subject {
        return {
            subjectName: '',
            subjectCode: '',
            organisationId: this.orgId,
            category: 'CORE',
            credits: 0,
            theoryHours: 0,
            labHours: 0,
            practicalHours: 0,
            isActive: true
        };
    }
}
