import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TabsModule } from 'primeng/tabs';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
interface Permission {
  label: string;
  value: string;
}
interface Role {
  id: string;
  name: string;
  roleDescription:string;
  permissions: string[];
}
@Component({
  selector: 'app-manage-role',
  imports: [TabsModule,CardModule,ButtonModule,MultiSelectModule,InputTextModule,CommonModule,ReactiveFormsModule,TagModule,TableModule],
  templateUrl: './manage-role.component.html',
  styleUrl: './manage-role.component.scss'
})
export class ManageRoleComponent {
  @Output() roleAdded = new EventEmitter<Role>();

  roleForm!: FormGroup;
  submitted = false;
  permissions: Permission[] = [];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.permissions = [
      { label: 'Create User', value: 'create-user' },
      { label: 'Edit User', value: 'edit-user' },
      { label: 'Delete User', value: 'delete-user' },
      { label: 'View Reports', value: 'view-reports' },
      { label: 'Manage Settings', value: 'manage-settings' }
    ];

    this.roleForm = this.fb.group({
      name: ['', Validators.required],
      roleDescription: [''],
      permissions: [[], Validators.required]
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.roleForm.invalid) {
      return;
    }

    const newRole: Role = {
      id: this.createId(),
      name: this.roleForm.value.name,
      roleDescription: this.roleForm.value.roleDescription,
      permissions: this.roleForm.value.permissions
    };

    this.roleAdded.emit(newRole);
    this.onReset();
  }

  onReset(): void {
    this.submitted = false;
    this.roleForm.reset();
  }

  private createId(): string {
    return Math.random().toString(36).substring(2, 9);
  }
  
}
