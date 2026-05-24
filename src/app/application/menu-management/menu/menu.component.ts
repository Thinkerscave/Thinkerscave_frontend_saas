import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms'; // Required for ngModel

import { TabViewModule } from 'primeng/tabview'; // Import TabViewModule
import { RadioButtonModule } from 'primeng/radiobutton'; // Import RadioButtonModule
import { CommonModule } from '@angular/common';
import { FieldsetModule } from 'primeng/fieldset';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule, Toast } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { FloatLabelModule } from 'primeng/floatlabel';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { InputSwitchModule } from 'primeng/inputswitch';
import { MenuService, MenuItem } from '../../services/menu.service';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { StandardListViewComponent } from '../../../shared/components/standard-list-view/standard-list-view.component';
import { ListViewConfig } from '../../../shared/components/standard-list-view/list-view-models';
import { LoginService } from '../../../services/login.service';
import { MenuMappingService } from '../../services/menu-mapping.service';
import { normalizePrimeIcon } from '../../../shared/utils/prime-icon.util';

@Component({
  selector: 'app-menu',
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    TabViewModule,
    RadioButtonModule,
    FieldsetModule,
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    FloatLabelModule,
    CardModule,
    ToastModule,
    InputSwitchModule,
    IconFieldModule,
    InputIconModule,
    StandardListViewComponent
  ],
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.scss',
  providers: [MessageService]
})
export class MenuComponent {
  toggleOrganizationStatus(_t143: any) {
    throw new Error('Method not implemented.');
  }
  editOrganization(_t143: any) {
    throw new Error('Method not implemented.');
  }
  title = '';
  menuItems: MenuItem[] = [];
  loading: boolean = false;
  isEditMode: boolean = false;
  activeTabIndex: number = 0;
  editMenuId: number | null = null;
  displayEditModal: boolean = false;
  editingMenuItem: MenuItem | null = null;

  constructor(private menuService: MenuService,
    private messageService: MessageService,
    private loginService: LoginService,
    private menuMappingService: MenuMappingService
  ) { }

  get listViewConfig(): ListViewConfig {
    return {
      title: 'Registered Menus',
      isClientSide: true,
      showSearch: true,
      searchPlaceholder: 'Search menus...',
      loading: this.loading,
      columns: [
        { field: 'name', header: 'Menu Name', type: 'text', sortable: true },
        {
          field: 'icon',
          header: 'Icon',
          type: 'icon',
          sortable: true,
          valueGetter: (menu) => menu.icon || 'pi pi-folder'
        },
        { field: 'url', header: 'Route', type: 'text', sortable: true },
        { field: 'order', header: 'Order', type: 'number', sortable: true, align: 'center' },
        { field: 'description', header: 'Description', type: 'text', sortable: true, width: '30%' },
        { field: 'createdBy', header: 'Created By', type: 'text', sortable: true },
        { field: 'lastModifiedDate', header: 'Last Updated', type: 'date', sortable: true },
        {
          field: 'isActive',
          header: 'Status',
          type: 'badge',
          sortable: true,
          valueGetter: (menu) => menu.isActive ? 'Active' : 'Inactive'
        }
      ],
      rowActions: [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          isPrimary: true,
          visibleFn: () => this.hasMenuWriteAccess(),
          actionFn: (menu) => this.onEdit(menu)
        },
        {
          label: 'Deactivate',
          icon: 'pi pi-ban',
          visibleFn: (menu) => menu.isActive && this.hasMenuWriteAccess(),
          actionFn: (menu) => this.toggleStatus(menu)
        },
        {
          label: 'Activate',
          icon: 'pi pi-check-circle',
          visibleFn: (menu) => !menu.isActive && this.hasMenuWriteAccess(),
          actionFn: (menu) => this.toggleStatus(menu)
        },
        {
          label: 'Delete',
          icon: 'pi pi-trash',
          color: 'danger',
          visibleFn: () => this.hasMenuWriteAccess(),
          actionFn: (menu) => this.deleteMenu(menu)
        }
      ]
    };
  }

  ngOnInit(): void {
    this.loadMenus();
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
    if (!this.menuName || !this.menuDescription) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Failed',
        detail: 'Both Menu Name and Description are required.'
      });
      return;
    }

    const menuData: MenuItem = {
      slNo: this.editMenuId || undefined,
      menuCode: this.isEditMode ? this.editingMenuItem?.menuCode : undefined, // ✅ include menuCode
      name: this.menuName.trim(),
      description: this.menuDescription.trim(),
      url: this.menuUrl.trim() || undefined,
      icon: normalizePrimeIcon(this.menuIcon, 'pi pi-folder'),
      order: this.menuOrder ?? undefined,
      isActive: this.editingMenuItem?.isActive ?? true
    };



    this.menuService.saveMenu(menuData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: this.isEditMode ? 'Menu Updated' : 'Menu Created',
          detail: `'${menuData.name}' has been ${this.isEditMode ? 'updated' : 'added'} successfully.`
        });

        this.loadMenus();   // reload list
  this.menuMappingService.refreshMenu();
        this.clearForm();
        this.isEditMode = false;
        this.activeTabIndex = 1;  // go back to View tab
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
    this.activeTabIndex = 0;  // switch to first tab (form tab)

    this.editMenuId = menuItem.slNo || null;
    this.menuName = menuItem.name;
    this.menuDescription = menuItem.description;
    this.menuUrl = menuItem.url || '';
    this.menuIcon = menuItem.icon || 'pi pi-folder';
    this.menuOrder = menuItem.order ?? null;

    // ✅ Keep menuCode for update
    this.editingMenuItem = { ...menuItem };
  }


  selectedGroupOption: string = 'Yes'; // Default to 'Yes'
  menuName: string = '';
  menuDescription: string = '';
  menuUrl: string = '';
  menuIcon: string = 'pi pi-folder';
  menuOrder: number | null = null;

  // submit(): void {
  //   console.log('Menu Submitted:', this.menuName, this.menuDescription);
  //   this.clearForm();
  // }

  resetForm(): void {
    console.log('Menu Creation Cancelled');
    this.clearForm();
  }

  clearForm(): void {
    this.menuName = '';
    this.menuDescription = '';
    this.menuUrl = '';
    this.menuIcon = 'pi pi-folder';
    this.menuOrder = null;
    this.editMenuId = null;
    this.editingMenuItem = null;
  }

  cancelEdit(): void {
    this.clearForm();
    this.isEditMode = false;
    this.activeTabIndex = 1;
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

    const nextStatus = !(menuItem.isActive ?? false);
    this.menuService.updateStatus(menuItem.menuCode, nextStatus).subscribe({
      next: () => {
        menuItem.isActive = nextStatus;
        this.messageService.add({
          severity: 'success',
          summary: 'Status Updated',
          detail: `Menu '${menuItem.name}' is now ${nextStatus ? 'Active' : 'Inactive'}.`
        });
        this.menuMappingService.refreshMenu();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update status.' });
      }
    });
  }

  deleteMenu(menuItem: MenuItem): void {
    if (!menuItem.menuCode) {
      this.messageService.add({ severity: 'warn', summary: 'Invalid Menu', detail: 'Menu code is missing.' });
      return;
    }

    const confirmed = window.confirm(`Delete menu '${menuItem.name}'? This will hide the menu and its sub-menus from navigation.`);
    if (!confirmed) {
      return;
    }

    this.menuService.deleteMenu(menuItem.menuCode).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Menu Deleted', detail: `${menuItem.name} has been removed from active navigation.` });
        this.loadMenus();
        this.menuMappingService.refreshMenu();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete menu.' });
      }
    });
  }

  private hasMenuWriteAccess(): boolean {
    const privileges = this.loginService.getUserPrivileges();
    const roles = this.loginService.getUserRole().map((role: any) => (role?.roleCode ?? role?.roleName ?? role).toString());
    return roles.includes('SUPER_ADMIN') || privileges.some(privilege => ['ADMIN_MENU_EDIT', 'ADMIN_MENU_DELETE', 'MANAGE_MENUS_EDIT'].includes(privilege));
  }

}
