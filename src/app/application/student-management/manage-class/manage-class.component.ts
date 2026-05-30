import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TabsModule, Tab } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';

interface ClassEntity {
    classId?: number;
    className: string;
    classCode?: string;
    organizationId?: number;
}

@Component({
    selector: 'app-manage-class',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TabsModule, Tab, ButtonModule, InputTextModule, TableModule, ToastModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './manage-class.component.html',
    styleUrl: './manage-class.component.scss'
})
export class ManageClassComponent implements OnInit {
    classForm!: FormGroup;
    classList: ClassEntity[] = [];
    activeTab = '1';
    isEditing = false;
    editingId: number | null = null;
    loading = false;

    private apiBase = `${environment.baseUrl}/classes`;

    constructor(private fb: FormBuilder, private http: HttpClient, private msg: MessageService) { }

    ngOnInit(): void {
        this.classForm = this.fb.group({
            className: ['', [Validators.required, Validators.minLength(1)]],
            classCode: ['']
        });
        this.loadClasses();
    }

    get f() { return this.classForm.controls; }

    loadClasses(): void {
        this.loading = true;
        this.http.get<ClassEntity[]>(`${this.apiBase}/getListOfClass`).subscribe({
            next: (res) => { this.classList = res ?? []; this.loading = false; },
            error: () => { this.loading = false; this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to load classes' }); }
        });
    }

    onSubmit(): void {
        if (this.classForm.invalid) { this.classForm.markAllAsTouched(); return; }
        const payload: ClassEntity = { ...this.classForm.value, ...(this.editingId ? { classId: this.editingId } : {}) };
        this.http.post<any>(`${this.apiBase}/saveOrUpdate`, payload).subscribe({
            next: (res) => {
                this.msg.add({ severity: 'success', summary: 'Success', detail: res.message });
                this.resetForm();
                this.loadClasses();
                this.activeTab = '1';
            },
            error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to save class' })
        });
    }

    onEdit(cls: ClassEntity): void {
        this.isEditing = true;
        this.editingId = cls.classId ?? null;
        this.classForm.patchValue(cls);
        this.activeTab = '0';
    }

    onDelete(cls: ClassEntity): void {
        if (!confirm(`Delete class "${cls.className}"?`)) return;
        this.http.delete<any>(`${this.apiBase}/${cls.classId}`).subscribe({
            next: (res) => { this.msg.add({ severity: 'success', summary: 'Deleted', detail: res.message }); this.loadClasses(); },
            error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Delete failed — may have linked sections or students' })
        });
    }

    resetForm(): void {
        this.isEditing = false;
        this.editingId = null;
        this.classForm.reset();
        this.classForm.markAsUntouched();
    }
}
