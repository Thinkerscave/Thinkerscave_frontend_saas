import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule, Table } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { CardModule } from 'primeng/card';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TabsModule } from 'primeng/tabs';
import { TagModule } from 'primeng/tag';
import { MenuService, MenuItem } from '../../services/menu.service';

@Component({
  selector: 'app-menu',
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
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  providers: [MessageService]
})
export class MenuComponent {
  // Form properties
  menuItems: MenuItem[] = [];
  loading: boolean = false;
  isEditMode: boolean = false;
  activeTabIndex: number = 0;
  editMenuId: number | null = null;
  editingMenuItem: MenuItem | null = null;
  globalFilterValue: string = '';
  
  // Form fields with validation tracking
  menuName: string = '';
  menuDescription: string = '';
  menuIcon: string = '';
  
  // Validation tracking
  formSubmitted: boolean = false;
  menuNameTouched: boolean = false;
  menuDescriptionTouched: boolean = false;
  menuIconTouched: boolean = false;

  constructor(
    private menuService: MenuService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadMenus();
  }

  // Validation helpers
  get menuNameInvalid(): boolean {
    return !this.menuName.trim();
  }

  get menuDescriptionInvalid(): boolean {
    return !this.menuDescription.trim();
  }

  get menuIconInvalid(): boolean {
    return !this.menuIcon.trim();
  }

  get isFormValid(): boolean {
    return !this.menuNameInvalid && !this.menuDescriptionInvalid && !this.menuIconInvalid;
  }

  // Touch handlers
  onMenuNameBlur(): void {
    this.menuNameTouched = true;
  }

  onMenuDescriptionBlur(): void {
    this.menuDescriptionTouched = true;
  }

  onMenuIconBlur(): void {
    this.menuIconTouched = true;
  }

  loadMenus(): void {
    this.loading = true;
    this.menuService.getAllMenus().subscribe({
      next: (menus) => {
        this.menuItems = menus;
        this.loading = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load menus. Please try again.'
        });
        this.loading = false;
      }
    });
  }

  submit(): void {
    this.formSubmitted = true;
    
    // Mark all fields as touched for validation display
    this.menuNameTouched = true;
    this.menuDescriptionTouched = true;
    this.menuIconTouched = true;
    
    // Check if form is valid
    if (!this.isFormValid) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Failed',
        detail: 'Please fill all required fields correctly.'
      });
      return;
    }

    const menuData: MenuItem = {
      slNo: this.editMenuId || undefined,
      menuCode: this.isEditMode ? this.editingMenuItem?.menuCode : undefined,
      name: this.menuName.trim(),
      description: this.menuDescription.trim(),
      icon: this.menuIcon.trim(),
      isActive: this.isEditMode ? this.editingMenuItem?.isActive : true
    };

    this.menuService.saveMenu(menuData).subscribe({
      next: () => {
        const action = this.isEditMode ? 'updated' : 'created';
        this.messageService.add({
          severity: 'success',
          summary: `Menu ${action.charAt(0).toUpperCase() + action.slice(1)}`,
          detail: `Menu '${menuData.name}' has been ${action} successfully.`
        });

        this.loadMenus();
        this.resetForm();
        this.isEditMode = false;
        this.activeTabIndex = 1; // Switch to View tab
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: err.error?.message || 'Failed to save menu. Try again later.'
        });
      }
    });
  }

  onEdit(menuItem: MenuItem): void {
    this.isEditMode = true;
    this.activeTabIndex = 0; // Switch to Add/Edit tab

    this.editMenuId = menuItem.slNo || null;
    this.menuName = menuItem.name;
    this.menuDescription = menuItem.description || '';
    this.menuIcon = menuItem.icon || '';
    
    // Reset validation states
    this.formSubmitted = false;
    this.menuNameTouched = false;
    this.menuDescriptionTouched = false;
    this.menuIconTouched = false;
    
    // Keep menuCode for update
    this.editingMenuItem = { ...menuItem };
  }

  resetForm(): void {
    this.menuName = '';
    this.menuDescription = '';
    this.menuIcon = '';
    this.formSubmitted = false;
    this.menuNameTouched = false;
    this.menuDescriptionTouched = false;
    this.menuIconTouched = false;
    this.isEditMode = false;
    this.editMenuId = null;
    this.editingMenuItem = null;
  }

  cancelEdit(): void {
    this.resetForm();
    this.activeTabIndex = 1; // Switch back to View tab
  }

  toggleStatus(menuItem: MenuItem): void {
    if (!menuItem.menuCode) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Menu',
        detail: 'Menu code is missing, cannot update status.'
      });
      return;
    }

    this.menuService.updateStatus(menuItem.menuCode, menuItem.isActive ?? false).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Status Updated',
          detail: `Menu '${menuItem.name}' is now ${menuItem.isActive ? 'Active' : 'Inactive'}.`
        });
      },
      error: () => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to update status.' 
        });
        // Revert the UI toggle
        menuItem.isActive = !menuItem.isActive;
      }
    });
  }

  onGlobalFilter(table: Table, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue = value;
    table.filterGlobal(value, 'contains');
  }
}