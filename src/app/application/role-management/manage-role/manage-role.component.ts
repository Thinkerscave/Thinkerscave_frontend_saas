import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { Role, RoleService } from '../../services/role.service';
import { MessageService } from 'primeng/api';
import { TabViewModule } from 'primeng/tabview';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule } from 'primeng/toast';
import { InputSwitchModule } from 'primeng/inputswitch';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';

@Component({
  selector: 'app-manage-role',
  imports: [CommonModule,
    FormsModule,
    TabViewModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    CardModule,
    ToastModule,
    InputSwitchModule,
    IconFieldModule,
    InputIconModule],
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

  // form fields
  roleName: string = '';
  roleDescription: string = '';

  constructor(private roleService: RoleService, private messageService: MessageService) {}

  ngOnInit(): void {
    this.loadRoles();
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
    if (!this.roleName || !this.roleDescription) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Failed',
        detail: 'Both Role Name and Description are required.'
      });
      return;
    }

    const roleData: Role = {
      roleId: this.editRoleId || undefined,
      roleName: this.roleName.trim(),
      description: this.roleDescription.trim()
    };

    this.roleService.saveOrUpdateRole(roleData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.isEditMode ? 'Role Updated' : 'Role Created',
          detail: `'${roleData.roleName}' has been ${this.isEditMode ? 'updated' : 'added'} successfully.`
        });

        this.loadRoles();
        this.clearForm();
        this.isEditMode = false;
        this.activeTabIndex = 1;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save role.' });
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
  }

  toggleStatus(role: Role): void {
    if (!role.roleId) {
      this.messageService.add({ severity: 'warn', summary: 'Invalid Role', detail: 'Role ID is missing.' });
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
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update status.' });
        role.isActive = !role.isActive; // revert
      }
    });
  }

  resetForm(): void {
    this.clearForm();
  }

  clearForm(): void {
    this.roleName = '';
    this.roleDescription = '';
    this.editRoleId = null;
    this.editingRole = null;
  }

  cancelEdit(): void {
    this.clearForm();
    this.isEditMode = false;
    this.activeTabIndex = 1; // back to View
  }
}
