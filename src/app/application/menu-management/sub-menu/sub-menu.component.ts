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
import { MenuMappingService } from '../../services/menu-mapping.service';
import { ToastModule } from 'primeng/toast';
import { MultiSelect } from 'primeng/multiselect';
import { StandardListViewComponent } from '../../../shared/components/standard-list-view/standard-list-view.component';
import { ListViewConfig } from '../../../shared/components/standard-list-view/list-view-models';
import { normalizePrimeIcon } from '../../../shared/utils/prime-icon.util';

@Component({
  selector: 'app-submenu',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TabViewModule, CardModule, InputTextModule,
    ButtonModule, TableModule, DropdownModule, InputSwitchModule, TooltipModule,
    IconFieldModule, InputIconModule, ToastModule, MultiSelect, StandardListViewComponent
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
  submenuIcon = 'pi pi-circle';
  submenuOrder: number | null = null;
  submenuActive = true;
  privilegeOptions: any[] = [];
  selectedPrivilegeIds: number[] = [];

  constructor(private subMenuService: SubMenuService,
    private menuService: MenuService,
    private messageService: MessageService,
    private menuMappingService: MenuMappingService) { }

  get listViewConfig(): ListViewConfig {
    return {
      title: 'Registered Sub-Menus',
      isClientSide: true,
      showSearch: true,
      searchPlaceholder: 'Search sub-menus...',
      loading: this.loading,
      columns: [
        { field: 'subMenuName', header: 'Sub-Menu Name', type: 'text', sortable: true },
        { field: 'menuName', header: 'Menu Name', type: 'text', sortable: true },
        { field: 'subMenuIcon', header: 'Icon', type: 'icon', sortable: true },
        { field: 'subMenuOrder', header: 'Order', type: 'number', sortable: true, align: 'center' },
        {
          field: 'subMenuUrl',
          header: 'Sub-Menu URL',
          type: 'text',
          sortable: true,
          valueGetter: (sub) => sub.subMenuUrl ? (sub.subMenuUrl.startsWith('/') ? sub.subMenuUrl : '/' + sub.subMenuUrl) : ''
        },
        {
          field: 'privileges',
          header: 'Privileges',
          type: 'tags',
          tagsGetter: (sub) => (sub.privileges || []).map((p: any) => p.privilegeName)
        },
        { field: 'subMenuDescription', header: 'Description', type: 'text', sortable: true, width: '25%' },
        { field: 'createdBy', header: 'Created By', type: 'text', sortable: true },
        { field: 'lastUpdatedOn', header: 'Last Updated', type: 'date', sortable: true },
        {
          field: 'subMenuIsActive',
          header: 'Status',
          type: 'badge',
          sortable: true,
          valueGetter: (sub) => sub.subMenuIsActive ? 'Active' : 'Inactive'
        }
      ],
      rowActions: [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          isPrimary: true,
          actionFn: (sub) => this.onEdit(sub)
        },
        {
          label: 'Deactivate',
          icon: 'pi pi-ban',
          visibleFn: (sub) => sub.subMenuIsActive,
          actionFn: (sub) => this.toggleStatus(sub)
        },
        {
          label: 'Activate',
          icon: 'pi pi-check-circle',
          visibleFn: (sub) => !sub.subMenuIsActive,
          actionFn: (sub) => this.toggleStatus(sub)
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash',
          color: 'danger',
          actionFn: (sub) => this.deleteSubmenu(sub)
        }
      ]
    };
  }

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
      subMenuIcon: normalizePrimeIcon(this.submenuIcon, 'pi pi-circle'),
      subMenuOrder: this.submenuOrder ?? undefined,
      menuId: this.selectedMenuId,
      subMenuIsActive: this.submenuActive,
      privilegeIds: this.selectedPrivilegeIds
    };

    this.subMenuService.saveSubmenu(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: this.isEditMode ? 'Updated' : 'Created', detail: `Submenu ${payload.subMenuName} saved` });
        this.loadSubmenus();
        this.menuMappingService.refreshMenu();
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
    this.submenuIcon = item.subMenuIcon || 'pi pi-circle';
    this.submenuOrder = item.subMenuOrder ?? null;
    this.submenuActive = item.subMenuIsActive ?? true;
    this.selectedPrivilegeIds = item.privilegeIds || [];
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
    this.submenuIcon = 'pi pi-circle';
    this.submenuOrder = null;
    this.submenuActive = true;
    this.selectedPrivilegeIds = [];
  }

  toggleStatus(item: SubmenuItem): void {
    if (!item.subMenuCode) {
      this.messageService.add({ severity: 'warn', summary: 'Invalid', detail: 'Submenu code missing.' });
      item.subMenuIsActive = !item.subMenuIsActive; // revert visually
      return;
    }
    const nextStatus = !(item.subMenuIsActive ?? false);
    this.subMenuService.updateStatus(item.subMenuCode, nextStatus).subscribe({
      next: () => {
        item.subMenuIsActive = nextStatus;
        this.messageService.add({ severity: 'success', summary: 'Status Updated', detail: `${item.subMenuName} is now ${nextStatus ? 'Active' : 'Inactive'}` });
        this.menuMappingService.refreshMenu();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update status' });
      }
    });
  }

  deleteSubmenu(item: SubmenuItem): void {
    if (!item.subMenuCode) {
      this.messageService.add({ severity: 'warn', summary: 'Invalid', detail: 'Submenu code missing.' });
      return;
    }

    const confirmed = window.confirm(`Delete submenu '${item.subMenuName}'? This will hide it from role mapping and navigation.`);
    if (!confirmed) {
      return;
    }

    this.subMenuService.deleteSubmenu(item.subMenuCode).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sub-menu Deleted', detail: `${item.subMenuName} has been removed from active navigation.` });
        this.loadSubmenus();
        this.menuMappingService.refreshMenu();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete submenu' })
    });
  }
}
