import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule, Table } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TooltipModule } from 'primeng/tooltip';
import { MultiSelectModule } from 'primeng/multiselect';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TabsModule } from 'primeng/tabs';

import { SubmenuItem, SubMenuService } from '../../services/sub-menu.service';
import { MenuService } from '../../services/menu.service';

interface Privilege {
  privilegeId: number;
  privilegeName: string;
}

@Component({
  selector: 'app-submenu',
  standalone: true,
  imports: [
    CommonModule, FormsModule, CardModule, InputTextModule,
    ButtonModule, TableModule, DropdownModule, InputSwitchModule, 
    TooltipModule, ToastModule, MultiSelectModule, TagModule, TabsModule
  ],
  templateUrl: './sub-menu.component.html',
  styleUrl: './sub-menu.component.scss',
  providers: [MessageService]
})
export class SubmenuComponent {
  submenuItems: any[] = []; // Changed to any[] to handle transformed data
  menuOptions: any[] = []; // { menuId, name, menuCode }
  privilegeOptions: Privilege[] = [];
  loading = false;
  isEditMode = false;
  activeTabIndex = 0;
  globalFilterValue: string = '';

  // Form model
  editingSubmenu?: SubmenuItem | null = null;
  selectedMenuId?: any | null;
  subMenuName = '';
  subMenuDescription = '';
  submenuUrl = '';
  submenuActive = true;
  selectedPrivilegeIds: number[] = [];

  // Validation tracking
  formSubmitted: boolean = false;
  selectedMenuTouched: boolean = false;
  subMenuNameTouched: boolean = false;
  subMenuUrlTouched: boolean = false;
  subMenuDescriptionTouched: boolean = false;
  privilegesTouched: boolean = false;

  constructor(
    private subMenuService: SubMenuService,
    private menuService: MenuService,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    this.loadSubmenus();
    this.loadMenusForDropdown();
    this.loadPrivileges();
  }

  // Validation helpers
  get selectedMenuInvalid(): boolean {
    return !this.selectedMenuId;
  }

  get subMenuNameInvalid(): boolean {
    return !this.subMenuName.trim() || this.subMenuName.trim().length < 2;
  }

  get subMenuUrlInvalid(): boolean {
    return !this.submenuUrl.trim();
  }

  get subMenuDescriptionInvalid(): boolean {
    return !this.subMenuDescription.trim();
  }

  get privilegesInvalid(): boolean {
    return !this.selectedPrivilegeIds || this.selectedPrivilegeIds.length === 0;
  }

  get isFormValid(): boolean {
    return !this.selectedMenuInvalid && 
           !this.subMenuNameInvalid && 
           !this.subMenuUrlInvalid && 
           !this.subMenuDescriptionInvalid && 
           !this.privilegesInvalid;
  }

  // Touch handlers
  onSelectedMenuBlur(): void {
    this.selectedMenuTouched = true;
  }

  onSubMenuNameBlur(): void {
    this.subMenuNameTouched = true;
  }

  onSubMenuUrlBlur(): void {
    this.subMenuUrlTouched = true;
  }

  onSubMenuDescriptionBlur(): void {
    this.subMenuDescriptionTouched = true;
  }

  onPrivilegesBlur(): void {
    this.privilegesTouched = true;
  }

  loadSubmenus(): void {
    this.loading = true;
    this.subMenuService.getAllSubmenus().subscribe({
      next: (data) => { 
        // Transform the data to include privileges for display
        this.submenuItems = this.transformSubmenuData(data || []);
        this.loading = false; 
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to load submenus. Please try again.' 
        });
      }
    });
  }

  // Transform SubmenuItem to include privileges for display
  private transformSubmenuData(items: SubmenuItem[]): any[] {
    return items.map(item => ({
      ...item,
      privileges: this.getPrivilegeNames(item.privilegeIds || [])
    }));
  }

  // Get privilege names from privilegeIds
  private getPrivilegeNames(privilegeIds: number[]): Privilege[] {
    return privilegeIds.map(id => {
      const privilege = this.privilegeOptions.find(p => p.privilegeId === id);
      return privilege || { privilegeId: id, privilegeName: `Privilege ${id}` };
    });
  }

  loadMenusForDropdown(): void {
    this.menuService.getAllActiveMenus().subscribe({
      next: menus => {
        this.menuOptions = menus.map(m => ({ 
          menuId: m.menuId, 
          menuCode: m.menuCode, 
          name: m.name 
        }));
      },
      error: () => {
        this.menuOptions = [];
        this.messageService.add({ 
          severity: 'warn', 
          summary: 'Warning', 
          detail: 'Failed to load menus. Please refresh the page.' 
        });
      }
    });
  }

  loadPrivileges(): void {
    this.subMenuService.getAllPrivileges().subscribe({
      next: (data) => {
        this.privilegeOptions = data || [];
        // Reload submenus to update privilege names
        if (this.submenuItems.length > 0) {
          this.submenuItems = this.transformSubmenuData(this.submenuItems);
        }
      },
      error: () => {
        this.privilegeOptions = [];
        this.messageService.add({ 
          severity: 'warn', 
          summary: 'Warning', 
          detail: 'Failed to load privileges. Please refresh the page.' 
        });
      }
    });
  }

  submit(): void {
    this.formSubmitted = true;
    
    // Mark all fields as touched
    this.selectedMenuTouched = true;
    this.subMenuNameTouched = true;
    this.subMenuUrlTouched = true;
    this.subMenuDescriptionTouched = true;
    this.privilegesTouched = true;

    // Check if form is valid
    if (!this.isFormValid) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Validation Failed', 
        detail: 'Please fill all required fields correctly.' 
      });
      return;
    }

    const payload: SubmenuItem = {
      subMenuId: this.editingSubmenu?.subMenuId,
      subMenuCode: this.editingSubmenu?.subMenuCode,
      subMenuName: this.subMenuName.trim(),
      subMenuDescription: this.subMenuDescription?.trim(),
      subMenuUrl: this.submenuUrl?.trim().startsWith('/') 
        ? this.submenuUrl.trim() 
        : '/' + this.submenuUrl.trim(),
      menuId: this.selectedMenuId,
      subMenuIsActive: this.submenuActive,
      privilegeIds: this.selectedPrivilegeIds
    };

    this.subMenuService.saveSubmenu(payload).subscribe({
      next: () => {
        const action = this.isEditMode ? 'updated' : 'created';
        this.messageService.add({ 
          severity: 'success', 
          summary: `Sub-Menu ${action.charAt(0).toUpperCase() + action.slice(1)}`, 
          detail: `Sub-menu '${payload.subMenuName}' has been ${action} successfully.` 
        });

        this.loadSubmenus();
        this.resetForm();
        this.isEditMode = false;
        this.activeTabIndex = 1;
      },
      error: (err) => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: err?.error?.message || 'Failed to save sub-menu. Please try again.' 
        });
      }
    });
  }

  onEdit(item: any): void {
    this.isEditMode = true;
    this.activeTabIndex = 0;
    
    this.editingSubmenu = item;
    this.selectedMenuId = item.menuId || null;
    this.subMenuName = item.subMenuName;
    this.subMenuDescription = item.subMenuDescription || '';
    this.submenuUrl = item.subMenuUrl || '';
    this.submenuActive = item.subMenuIsActive ?? true;
    this.selectedPrivilegeIds = item.privilegeIds || [];
    
    // Reset validation states
    this.formSubmitted = false;
    this.selectedMenuTouched = false;
    this.subMenuNameTouched = false;
    this.subMenuUrlTouched = false;
    this.subMenuDescriptionTouched = false;
    this.privilegesTouched = false;
  }

  cancelEdit(): void {
    this.resetForm();
    this.activeTabIndex = 1;
  }

  resetForm(): void {
    this.editingSubmenu = null;
    this.selectedMenuId = null;
    this.subMenuName = '';
    this.subMenuDescription = '';
    this.submenuUrl = '';
    this.submenuActive = true;
    this.selectedPrivilegeIds = [];
    
    // Reset validation states
    this.formSubmitted = false;
    this.selectedMenuTouched = false;
    this.subMenuNameTouched = false;
    this.subMenuUrlTouched = false;
    this.subMenuDescriptionTouched = false;
    this.privilegesTouched = false;
    this.isEditMode = false;
  }

  toggleStatus(item: any): void {
    if (!item.subMenuCode) {
      this.messageService.add({ 
        severity: 'warn', 
        summary: 'Invalid Sub-Menu', 
        detail: 'Sub-menu code is missing. Cannot update status.' 
      });
      item.subMenuIsActive = !item.subMenuIsActive; // revert visually
      return;
    }
    
    this.subMenuService.updateStatus(item.subMenuCode, item.subMenuIsActive ?? false).subscribe({
      next: () => {
        this.messageService.add({ 
          severity: 'success', 
          summary: 'Status Updated', 
          detail: `Sub-menu '${item.subMenuName}' is now ${item.subMenuIsActive ? 'Active' : 'Inactive'}.` 
        });
      },
      error: () => {
        this.messageService.add({ 
          severity: 'error', 
          summary: 'Error', 
          detail: 'Failed to update status. Please try again.' 
        });
        item.subMenuIsActive = !item.subMenuIsActive; // rollback
      }
    });
  }

  onGlobalFilter(table: Table, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.globalFilterValue = value;
    table.filterGlobal(value, 'contains');
  }
}