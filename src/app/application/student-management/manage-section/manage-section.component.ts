import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TabsModule, Tab } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';

interface ClassOption { label: string; value: number; }
interface Section {
    sectionId?: number;
    sectionName: string;
    classEntity?: { classId: number; className?: string };
}

@Component({
    selector: 'app-manage-section',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule, TabsModule, Tab, ButtonModule, InputTextModule, DropdownModule, TableModule, ToastModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './manage-section.component.html',
    styleUrl: './manage-section.component.scss'
})
export class ManageSectionComponent implements OnInit {
    sectionForm!: FormGroup;
    sectionList: Section[] = [];
    classOptions: ClassOption[] = [];
    filterClassId: number | null = null;
    activeTab = '1';
    isEditing = false;
    editingId: number | null = null;
    loading = false;

    private classApi = `${environment.baseUrl}/classes`;
    private sectionApi = `${environment.baseUrl}/sections`;

    constructor(private fb: FormBuilder, private http: HttpClient, private msg: MessageService) { }

    ngOnInit(): void {
        this.sectionForm = this.fb.group({
            sectionName: ['', [Validators.required]],
            classId: [null, [Validators.required]]
        });
        this.loadClasses();
    }

    get f() { return this.sectionForm.controls; }

    loadClasses(): void {
        this.http.get<any[]>(`${this.classApi}/getListOfClass`).subscribe({
            next: (res) => {
                this.classOptions = (res ?? []).map((c: any) => ({ label: c.className, value: c.classId }));
            },
            error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to load classes' })
        });
    }

    loadSections(classId: number): void {
        this.loading = true;
        this.http.get<any[]>(`${this.sectionApi}/getListOfSectionsByClassId/${classId}`).subscribe({
            next: (res) => { this.sectionList = res ?? []; this.loading = false; },
            error: () => { this.loading = false; this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to load sections' }); }
        });
    }

    onClassFilterChange(classId: number): void {
        if (classId) this.loadSections(classId);
    }

    onSubmit(): void {
        if (this.sectionForm.invalid) { this.sectionForm.markAllAsTouched(); return; }
        const { classId, sectionName } = this.sectionForm.value;
        const payload: Section = {
            sectionName,
            classEntity: { classId },
            ...(this.editingId ? { sectionId: this.editingId } : {})
        };
        this.http.post<any>(`${this.sectionApi}/saveOrUpdate`, payload).subscribe({
            next: (res) => {
                this.msg.add({ severity: 'success', summary: 'Success', detail: res.message });
                this.resetForm();
                this.loadSections(classId);
                this.activeTab = '1';
            },
            error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to save section' })
        });
    }

    onEdit(section: Section): void {
        this.isEditing = true;
        this.editingId = section.sectionId ?? null;
        this.sectionForm.patchValue({ sectionName: section.sectionName, classId: section.classEntity?.classId });
        this.activeTab = '0';
    }

    onDelete(section: Section): void {
        if (!confirm(`Delete section "${section.sectionName}"?`)) return;
        this.http.delete<any>(`${this.sectionApi}/${section.sectionId}`).subscribe({
            next: (res) => {
                this.msg.add({ severity: 'success', summary: 'Deleted', detail: res.message });
                const classId = this.sectionForm.value.classId;
                if (classId) this.loadSections(classId);
                else this.sectionList = this.sectionList.filter(s => s.sectionId !== section.sectionId);
            },
            error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Delete failed' })
        });
    }

    resetForm(): void {
        this.isEditing = false;
        this.editingId = null;
        this.sectionForm.reset();
        this.sectionForm.markAsUntouched();
    }
}
