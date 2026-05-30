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

interface Branch {
    id?: number;
    branchName: string;
    branchCode: string;
    location: string;
    isActive?: boolean;
}

@Component({
    selector: 'app-manage-branch',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, TabsModule, Tab, ButtonModule, InputTextModule, TableModule, ToastModule, TooltipModule],
    providers: [MessageService],
    templateUrl: './manage-branch.component.html',
    styleUrl: './manage-branch.component.scss'
})
export class ManageBranchComponent implements OnInit {
    branchForm!: FormGroup;
    branchList: Branch[] = [];
    activeTab = '1';
    isEditing = false;
    editingId: number | null = null;
    loading = false;

    private apiBase = `${environment.baseUrl}/branches`;

    constructor(private fb: FormBuilder, private http: HttpClient, private msg: MessageService) { }

    ngOnInit(): void {
        this.branchForm = this.fb.group({
            branchName: ['', [Validators.required, Validators.minLength(2)]],
            branchCode: ['', [Validators.required]],
            location: ['', [Validators.required]]
        });
        this.loadBranches();
    }

    get f() { return this.branchForm.controls; }

    loadBranches(): void {
        this.loading = true;
        this.http.get<any>(`${this.apiBase}/getAllBranch`).subscribe({
            next: (res) => { this.branchList = res.data ?? []; this.loading = false; },
            error: () => { this.loading = false; this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to load branches' }); }
        });
    }

    onSubmit(): void {
        if (this.branchForm.invalid) { this.branchForm.markAllAsTouched(); return; }
        const payload: Branch = { ...this.branchForm.value, ...(this.editingId ? { id: this.editingId } : {}) };
        this.http.post<any>(`${this.apiBase}/saveOrUpdate`, payload).subscribe({
            next: (res) => {
                this.msg.add({ severity: 'success', summary: 'Success', detail: res.message });
                this.resetForm();
                this.loadBranches();
                this.activeTab = '1';
            },
            error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to save branch' })
        });
    }

    onEdit(branch: Branch): void {
        this.isEditing = true;
        this.editingId = branch.id ?? null;
        this.branchForm.patchValue(branch);
        this.activeTab = '0';
    }

    onToggle(branch: Branch): void {
        this.http.patch<any>(`${this.apiBase}/${branch.id}/toggle`, {}).subscribe({
            next: (res) => { this.msg.add({ severity: 'info', summary: 'Updated', detail: res.message }); this.loadBranches(); },
            error: () => this.msg.add({ severity: 'error', summary: 'Error', detail: 'Failed to update status' })
        });
    }

    resetForm(): void {
        this.isEditing = false;
        this.editingId = null;
        this.branchForm.reset();
        this.branchForm.markAsUntouched();
    }
}
