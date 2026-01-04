import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { TableModule, Table } from 'primeng/table';
import { Role, RoleService } from '../../services/role.service';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-manage-role',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    CardModule,
    ToastModule,
    InputSwitchModule,
    TabsModule,
    TagModule
  ],
  templateUrl: './manage-role.component.html',
  styleUrl: './manage-role.component.scss',
  providers: [MessageService]
})
export class ManageRoleComponent {
  roles: Role[] = [];
  loading = false;
  isEditMode = false;
  activeTabIndex = 0;
  editRoleId: number | null = null;
  editingRole: Role | null = null;
  globalFilterValue: string = '';

  // form fields
  roleName: string = '';
  roleDescription: string = '';

  // Validation tracking
  formSubmitted: boolean = false;
  roleNameTouched: boolean = false;
  roleDescriptionTouched: boolean = false;

  constructor(private roleService: RoleService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadRoles();
  }

  // Validation helpers
  get roleNameInvalid(): boolean {
    return !this.roleName.trim();
  }

  get roleDescriptionInvalid(): boolean {
    return !this.roleDescription.trim();
  }

  get isFormValid(): boolean {
    return !this.roleNameInvalid && !this.roleDescriptionInvalid;
  }

  // Touch handlers
  onRoleNameBlur(): void {
    this.roleNameTouched = true;
  }

  onRoleDescriptionBlur(): void {
    this.roleDescriptionTouched = true;
  }

  loadRoles(): void {
    this.loading = true;
    this.roleService.getAllRoles().subscribe({
      next: (data) => {
        this.roles = data;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load roles.' });
        this.loading = false;
      }
    });
  }

  submit(): void {
    this.formSubmitted = true;
    
    // Mark all fields as touched for validation display
    this.roleNameTouched = true;
    this.roleDescriptionTouched = true;
    
    if (!this.isFormValid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Failed',
        detail: 'Please fill all required fields correctly.'
      });
      return;
    }

    const roleData: Role = {
      roleId: this.editRoleId || undefined,
      roleName: this.roleName.trim(),
      description: this.roleDescription.trim(),
      isActive: this.isEditMode ? this.editingRole?.isActive : true
    };

    this.roleService.saveOrUpdateRole(roleData).subscribe({
      next: () => {
        const action = this.isEditMode ? 'updated' : 'created';
        this.messageService.add({
          severity: 'success',
          summary: `Role ${action.charAt(0).toUpperCase() + action.slice(1)}`,
          detail: `Role '${roleData.roleName}' has been ${action} successfully.`
        });

        this.loadRoles();
        this.resetForm();
        this.isEditMode = false;
        this.activeTabIndex = 1;
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: err.error?.message || 'Failed to save role. Please try again.' 
        });
      }
    });
  }

  onEdit(role: Role): void {
    this.isEditMode = true;
    this.activeTabIndex = 0;
    this.editRoleId = role.roleId || null;
    this.roleName = role.roleName;
    this.roleDescription = role.description!;
    this.editingRole = { ...role };
    
    // Reset validation states
    this.formSubmitted = false;
    this.roleNameTouched = false;
    this.roleDescriptionTouched = false;
  }

  toggleStatus(role: Role): void {
    if (!role.roleId) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Invalid Role', 
        detail: 'Role ID is missing. Cannot update status.' 
      });
      return;
    }

    this.roleService.updateStatus(role.roleId, role.isActive ?? false).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Status Updated',
          detail: `Role '${role.roleName}' is now ${role.isActive ? 'Active' : 'Inactive'}.`
        });
      },
      error: () => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to update status. Please try again.' 
        });
        role.isActive = !role.isActive; // revert
      }
    });
  }

  resetForm(): void {
    this.clearForm();
    this.formSubmitted = false;
    this.roleNameTouched = false;
    this.roleDescriptionTouched = false;
    this.isEditMode = false;
  }

  clearForm(): void {
    this.roleName = '';
    this.roleDescription = '';
    this.editRoleId = null;
    this.editingRole = null;
  }

  cancelEdit(): void {
    this.resetForm();
    this.activeTabIndex = 1;
  }

  onGlobalFilter(table: Table, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue = value;
    table.filterGlobal(value, 'contains');
  }
}