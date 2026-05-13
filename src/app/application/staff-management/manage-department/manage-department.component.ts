import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { TabsModule, Tab } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextarea } from 'primeng/inputtextarea';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { environment } from '../../../../environments/environment';

interface Department {
    id?: number;
    departmentName: string;
    departmentCode: string;
    description?: string;
    isActive?: boolean;
}

@Component({
    selector: 'app-manage-department',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TabsModule, Tab, ButtonModule, InputTextModule, InputTextarea, TableModule, ToastModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './manage-department.component.html',
    styleUrl: './manage-department.component.scss'
})
export class ManageDepartmentComponent implements OnInit {
    deptForm!: FormGroup;
    deptList: Department[] = [];
    activeTab = '1';
    isEditing = false;
    editingId: number | null = null;
    loading = false;

    private apiBase = `${environment.baseUrl}/departments`;

    constructor(private fb: FormBuilder, private http: HttpClient, private msg: MessageService) { }

    ngOnInit(): void {
        this.deptForm = this.fb.group({
            departmentName: ['', [Validators.required, Validators.minLength(2)]],
            departmentCode: ['', [Validators.required]],
            description: ['']
        });
        this.loadDepartments();
    }

    get f() { return this.deptForm.controls; }

    loadDepartments(): void {
        this.loading = true;
        this.http.get<any>(`${this.apiBase}/getAllDepartment`).subscribe({
            next: (res) => { this.deptList = res.data ?? []; this.loading = false; },
            error: () => { this.loading = false; this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to load departments' }); }
        });
    }

    onSubmit(): void {
        if (this.deptForm.invalid) { this.deptForm.markAllAsTouched(); return; }
        const payload: Department = { ...this.deptForm.value, ...(this.editingId ? { id: this.editingId } : {}) };
        this.http.post<any>(`${this.apiBase}/saveOrUpdate`, payload).subscribe({
            next: (res) => {
                this.msg.add({ severity: 'success', summary: 'Success', detail: res.message });
                this.resetForm();
                this.loadDepartments();
                this.activeTab = '1';
            },
            error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to save department' })
        });
    }

    onEdit(dept: Department): void {
        this.isEditing = true;
        this.editingId = dept.id ?? null;
        this.deptForm.patchValue(dept);
        this.activeTab = '0';
    }

    onToggle(dept: Department): void {
        this.http.patch<any>(`${this.apiBase}/${dept.id}/toggle`, {}).subscribe({
            next: (res) => { this.msg.add({ severity: 'info', summary: 'Updated', detail: res.message }); this.loadDepartments(); },
            error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Update failed' })
        });
    }

    resetForm(): void {
        this.isEditing = false;
        this.editingId = null;
        this.deptForm.reset();
        this.deptForm.markAsUntouched();
    }
}
