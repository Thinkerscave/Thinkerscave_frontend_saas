import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';

import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { DropdownModule } from 'primeng/dropdown';
import { InputSwitchModule } from 'primeng/inputswitch';
import { TooltipModule } from 'primeng/tooltip';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { SubmenuItem, SubMenuService } from '../../services/sub-menu.service';
import { MenuService } from '../../services/menu.service';
import { ToastModule } from 'primeng/toast';
import { MultiSelect } from 'primeng/multiselect';

@Component({
  selector: 'app-submenu',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TabViewModule, CardModule, InputTextModule,
    ButtonModule, TableModule, DropdownModule, InputSwitchModule, TooltipModule,
    IconFieldModule, InputIconModule, ToastModule, MultiSelect
  ],
  templateUrl: './sub-menu.component.html',
  styleUrl: './sub-menu.component.scss',
  providers: [MessageService]
})
export class SubmenuComponent {
  submenuItems: SubmenuItem[] = [];
  menuOptions: any[] = []; // { menuId, name, menuCode }
  loading = false;
  isEditMode = false;
  activeTabIndex = 0;

  // Form model
  editingSubmenu?: SubmenuItem | null = null;
  selectedMenuId?: any | null;
  subMenuName = '';
  subMenuDescription = '';
  submenuUrl = '';
  submenuActive = true;
  privilegeOptions: any[] = [];
  selectedPrivilegeIds: number[] = [];

  constructor(private subMenuService: SubMenuService,
    private menuService: MenuService,
    private messageService: MessageService) { }

  ngOnInit(): void {
    this.loadSubmenus();
    this.loadMenusForDropdown();
    this.loadPrivileges();
  }

  loadSubmenus(): void {
    this.loading = true;
    this.subMenuService.getAllSubmenus().subscribe({
      next: (data) => { this.submenuItems = data || []; this.loading = false; },
      error: (err) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load submenus' });
      }
    });
  }

  loadMenusForDropdown(): void {
    this.menuService.getAllActiveMenus().subscribe({
      next: menus => {
        // Normalize to dropdown format
        this.menuOptions = menus.map(m => ({ menuId: m.menuId, menuCode: m.menuCode, name: m.name }));
      },
      error: () => {
        this.menuOptions = [];
      }
    });
  }

  loadPrivileges(): void {
    this.subMenuService.getAllPrivileges().subscribe({
      next: (data) => {
        this.privilegeOptions = data || [];
      },
      error: () => {
        this.privilegeOptions = [];
      }
    });
  }

  submit(): void {
    if (!this.selectedMenuId) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please select a menu.' });
      return;
    }
    if (!this.subMenuName || this.subMenuName.trim().length < 2) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Submenu name is required (min 2 chars).' });
      return;
    }

    const payload: SubmenuItem = {
      subMenuId: this.editingSubmenu?.subMenuId,
      subMenuCode: this.editingSubmenu?.subMenuCode,
      subMenuName: this.subMenuName.trim(),
      subMenuDescription: this.subMenuDescription?.trim(),
      subMenuUrl: this.submenuUrl?.trim(),
      menuId: this.selectedMenuId,
      subMenuIsActive: this.submenuActive,
      privilegeIds: this.selectedPrivilegeIds
    };

    this.subMenuService.saveSubmenu(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: this.isEditMode ? 'Updated' : 'Created', detail: `Submenu ${payload.subMenuName} saved` });
        this.loadSubmenus();
        this.clearForm();
        this.isEditMode = false;
        this.activeTabIndex = 1;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to save submenu' });
      }
    });
  }

  onEdit(item: SubmenuItem): void {
    this.isEditMode = true;
    this.activeTabIndex = 0;
    this.editingSubmenu = { ...item };
    this.selectedMenuId = item.menuId || null;
    this.subMenuName = item.subMenuName;
    this.subMenuDescription = item.subMenuDescription || '';
    this.submenuUrl = item.subMenuUrl || '';
    this.submenuActive = item.subMenuIsActive ?? true;
  }

  cancelEdit(): void {
    this.clearForm();
    this.isEditMode = false;
    this.activeTabIndex = 1;
  }

  resetForm(): void {
    this.clearForm();
  }

  clearForm(): void {
    this.editingSubmenu = null;
    this.selectedMenuId = null;
    this.subMenuName = '';
    this.subMenuDescription = '';
    this.submenuUrl = '';
    this.submenuActive = true;
  }

  toggleStatus(item: SubmenuItem): void {
    if (!item.subMenuCode) {
      this.messageService.add({ severity: 'warn', summary: 'Invalid', detail: 'Submenu code missing.' });
      item.subMenuIsActive = !item.subMenuIsActive; // revert visually
      return;
    }
    this.subMenuService.updateStatus(item.subMenuCode, item.subMenuIsActive ?? false).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Status Updated', detail: `${item.subMenuName} is now ${item.subMenuIsActive ? 'Active' : 'Inactive'}` });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update status' });
        item.subMenuIsActive = !item.subMenuIsActive; // rollback
      }
    });
  }
}
