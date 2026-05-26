import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// PrimeNG Imports
import { TabViewModule } from 'primeng/tabview';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DialogModule } from 'primeng/dialog';
import { TooltipModule } from 'primeng/tooltip';
import { ToastModule, Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { catchError, forkJoin, of } from 'rxjs';

// Services
import { MenuService, MenuItem } from '../../services/menu.service';
import { SubMenuService, SubmenuItem } from '../../services/sub-menu.service';
import { RoleService, Role } from '../../services/role.service';
import { RoleMenuMappingService } from '../../services/role-menu-mapping.service';
import { MenuSequenceService, MenuOrder } from '../../services/menu-sequence.service';
import { MenuMappingService } from '../../services/menu-mapping.service';
import { LoginService } from '../../../services/login.service';
import { normalizePrimeIcon } from '../../../shared/utils/prime-icon.util';

interface IconDef {
  class: string;
  name: string;
  category: string;
}

interface WorkspaceActivity {
  id: number;
  action: string;
  entity: string;
  details: string;
  user: string;
  time: string;
  severity: 'success' | 'warn' | 'danger' | 'info';
}

interface PermissionDistributionItem {
  privilegeId: number;
  name: string;
  count: number;
  percentage: number;
  className: string;
}

interface RolePrivilegeMapping {
  subMenuId: number;
  privilegeIds: number[];
}

@Component({
  selector: 'app-navigation-access',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    TabViewModule,
    CardModule,
    DropdownModule,
    TableModule,
    ButtonModule,
    CheckboxModule,
    InputTextModule,
    InputSwitchModule,
    DialogModule,
    TooltipModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './navigation-access.component.html',
  styleUrl: './navigation-access.component.scss'
})
export class NavigationAccessComponent implements OnInit {
  activeTab = 0;
  loadingWorkspace = false;

  // Stat Counts
  totalMenus = 0;
  totalSubMenus = 0;
  totalRoles = 0;
  totalPermissionAssignments = 0;

  // Activity Log
  activities: WorkspaceActivity[] = [];

  // Raw API Lists
  menus: MenuItem[] = [];
  subMenus: SubmenuItem[] = [];
  roles: Role[] = [];
  roleDropdownOptions: any[] = [];
  privilegesList: any[] = [];
  rolePermissionCounts = new Map<number, number>();
  privilegeUsageCounts = new Map<number, number>();

  // ============================================================================
  // NAVIGATION BUILDER STATE
  // ============================================================================
  menuTree: any[] = [];
  selectedNode: { type: 'menu' | 'submenu'; data: any } | null = null;
  expandedNodes = new Set<string>();
  draggedMenuIndex: number | null = null;
  draggedSubMenu: { parentMenuId: number; index: number } | null = null;
  savingSequence = false;

  // Configuration Panel Form Fields
  configForm = {
    type: 'menu' as 'menu' | 'submenu',
    id: null as number | null,
    code: '',
    name: '',
    icon: 'pi pi-folder',
    url: '',
    description: '',
    order: 1,
    isActive: true,
    parentId: null as number | null, // linked menuId if submenu
    privilegeIds: [] as number[]
  };

  // Icon Picker Panel Dialog
  showIconPicker = false;
  searchIconQuery = '';
  private readonly roleAccentPalette = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2', '#db2777', '#4f46e5', '#64748b'];
  popularIcons: IconDef[] = [
    { class: 'pi pi-home', name: 'Home', category: 'General' },
    { class: 'pi pi-users', name: 'Users', category: 'Users' },
    { class: 'pi pi-id-card', name: 'Profile/ID', category: 'General' },
    { class: 'pi pi-book', name: 'Book', category: 'Education' },
    { class: 'pi pi-calendar', name: 'Calendar', category: 'General' },
    { class: 'pi pi-phone', name: 'Phone', category: 'General' },
    { class: 'pi pi-cog', name: 'Settings/Cog', category: 'System' },
    { class: 'pi pi-lock', name: 'Lock/Access', category: 'Security' },
    { class: 'pi pi-shield', name: 'Shield', category: 'Security' },
    { class: 'pi pi-globe', name: 'Globe/Region', category: 'General' },
    { class: 'pi pi-bars', name: 'Bars/Menu', category: 'General' },
    { class: 'pi pi-list', name: 'List', category: 'General' },
    { class: 'pi pi-plus', name: 'Plus/Add', category: 'General' },
    { class: 'pi pi-pencil', name: 'Pencil/Edit', category: 'General' },
    { class: 'pi pi-folder', name: 'Folder', category: 'Storage' },
    { class: 'pi pi-file', name: 'File', category: 'Storage' },
    { class: 'pi pi-chart-line', name: 'Chart/Growth', category: 'Analytics' },
    { class: 'pi pi-chart-bar', name: 'Bar Chart', category: 'Analytics' },
    { class: 'pi pi-money-bill', name: 'Money/Salary', category: 'Finance' },
    { class: 'pi pi-percentage', name: 'Percent', category: 'Finance' },
    { class: 'pi pi-exclamation-circle', name: 'Alert', category: 'General' },
    { class: 'pi pi-briefcase', name: 'Briefcase/Job', category: 'General' },
    { class: 'pi pi-building', name: 'Building', category: 'Structure' },
    { class: 'pi pi-compass', name: 'Compass', category: 'General' },
    { class: 'pi pi-sliders-h', name: 'Controls', category: 'Settings' },
    { class: 'pi pi-bell', name: 'Bell/Alert', category: 'Notifications' },
    { class: 'pi pi-clock', name: 'Clock/Time', category: 'General' },
    { class: 'pi pi-credit-card', name: 'Credit Card', category: 'Finance' },
    { class: 'pi pi-table', name: 'Table', category: 'General' },
    { class: 'pi pi-sort-alt', name: 'Sequence/Arrows', category: 'General' }
  ];

  // ============================================================================
  // ACCESS CONTROL STATE (ROLE MENU PRIVILEGE MAPPING)
  // ============================================================================
  selectedRoleId: number | null = null;
  loadingRolePrivileges = false;
  // Selected privileges: Map<subMenuId, Set<privilegeId>>
  selectedRolePrivileges = new Map<number, Set<number>>();
  savingAccessControl = false;
  searchRoleQuery = '';
  moduleExpandedState = new Map<string, boolean>();

  // ============================================================================
  // ROLE MANAGEMENT STATE
  // ============================================================================
  roleFormVisible = false;
  roleFormEditMode = false;
  roleForm = {
    roleId: null as number | null,
    roleCode: '',
    roleName: '',
    description: '',
    isActive: true
  };
  roleSaving = false;

  constructor(
    private menuService: MenuService,
    private subMenuService: SubMenuService,
    private roleService: RoleService,
    private roleMenuMappingService: RoleMenuMappingService,
    private menuSequenceService: MenuSequenceService,
    private menuMappingService: MenuMappingService,
    private loginService: LoginService,
    private messageService: MessageService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    // Intercept active route tab if accessed via sub-menu redirects
    this.detectPreferentialTab();

    this.loadAllData();
  }

  detectPreferentialTab(): void {
    const url = this.router.url;
    if (url.includes('manage-menu')) {
      this.activeTab = 1; // Nav Builder tab
      this.configForm.type = 'menu';
    } else if (url.includes('manage-sub-menu')) {
      this.activeTab = 1; // Nav Builder tab
      this.configForm.type = 'submenu';
    } else if (url.includes('menu-sequence')) {
      this.activeTab = 1; // Nav Builder tab
    } else if (url.includes('role-menu-mapping')) {
      this.activeTab = 2; // Access Control tab
    } else if (url.includes('role/manage')) {
      this.activeTab = 3; // Roles Dashboard tab
    } else {
      this.activeTab = 0; // Overview tab
    }
  }

  onTabChange(event: any): void {
    this.activeTab = event.index;
    this.selectedNode = null;
    this.clearConfigForm();
  }

  loadAllData(): void {
    this.loadingWorkspace = true;
    this.loadingRolePrivileges = true;

    forkJoin({
      menus: this.menuService.getAllMenus(),
      subMenus: this.subMenuService.getAllSubmenus(),
      roles: this.roleService.getAllRoles(),
      privileges: this.subMenuService.getAllPrivileges()
    }).subscribe({
      next: ({ menus, subMenus, roles, privileges }) => {
        this.menus = menus || [];
        this.subMenus = subMenus || [];
        this.roles = roles || [];
        this.privilegesList = privileges || [];

        this.totalMenus = this.menus.length;
        this.totalSubMenus = this.subMenus.length;
        this.totalRoles = this.roles.length;
        this.roleDropdownOptions = this.roles.map(role => ({ label: role.roleName, value: role.roleId }));

        this.buildMenuTree();
        this.loadRolePermissionCounts();

        const selectedRoleStillExists = this.roles.some(role => role.roleId === this.selectedRoleId);
        if (!selectedRoleStillExists) {
          this.selectedRoleId = this.roles[0]?.roleId ?? null;
        }

        if (this.selectedRoleId) {
          this.onAccessControlRoleChange(this.selectedRoleId);
        } else {
          this.loadingRolePrivileges = false;
        }

        this.loadingWorkspace = false;
      },
      error: () => {
        this.loadingWorkspace = false;
        this.loadingRolePrivileges = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load administration workspace data' });
      }
    });
  }

  private loadRolePermissionCounts(): void {
    this.rolePermissionCounts.clear();
    this.privilegeUsageCounts.clear();
    this.totalPermissionAssignments = 0;

    const rolesWithIds = this.roles.filter((role): role is Role & { roleId: number } => typeof role.roleId === 'number');
    if (!rolesWithIds.length) {
      return;
    }

    const requests = rolesWithIds.map(role =>
      this.roleMenuMappingService.getRoleMenuPrivileges(role.roleId).pipe(
        catchError(() => of([] as RolePrivilegeMapping[]))
      )
    );

    forkJoin(requests).subscribe(results => {
      results.forEach((mappings, index) => {
        const roleId = rolesWithIds[index].roleId;
        const count = this.countPrivileges(mappings);
        this.rolePermissionCounts.set(roleId, count);
        this.totalPermissionAssignments += count;

        mappings.forEach(mapping => {
          mapping.privilegeIds.forEach(privilegeId => {
            this.privilegeUsageCounts.set(privilegeId, (this.privilegeUsageCounts.get(privilegeId) || 0) + 1);
          });
        });
      });
    });
  }

  private countPrivileges(mappings: RolePrivilegeMapping[]): number {
    return mappings.reduce((total, mapping) => total + (mapping.privilegeIds?.length || 0), 0);
  }

  buildMenuTree(): void {
    const shouldInitializeExpansion = this.expandedNodes.size === 0;
    const tree = this.menus
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((menu, index) => {
      const menuId = menu.menuId || menu.slNo;
      const children = this.subMenus.filter(sub => sub.menuId === menuId);
      const nodeKey = 'menu-' + menuId;
      if (shouldInitializeExpansion && index < 4) {
        this.expandedNodes.add(nodeKey);
      }
      return {
        ...menu,
        menuId,
        icon: normalizePrimeIcon(menu.icon, 'pi pi-folder'),
        expanded: this.expandedNodes.has(nodeKey),
        children: children.sort((a, b) => (a.subMenuOrder || 0) - (b.subMenuOrder || 0))
      };
    });
    this.menuTree = tree;
  }

  toggleNode(key: string, event: Event): void {
    event.stopPropagation();
    if (this.expandedNodes.has(key)) {
      this.expandedNodes.delete(key);
    } else {
      this.expandedNodes.add(key);
    }
    this.buildMenuTree();
  }

  selectNode(type: 'menu' | 'submenu', data: any): void {
    this.selectedNode = { type, data };
    if (type === 'menu') {
      this.configForm = {
        type: 'menu',
        id: data.menuId || data.slNo || null,
        code: data.menuCode || '',
        name: data.name,
        icon: data.icon || 'pi pi-folder',
        url: data.url || '',
        description: data.description || '',
        order: data.order || 1,
        isActive: data.isActive ?? true,
        parentId: null,
        privilegeIds: []
      };
    } else {
      this.configForm = {
        type: 'submenu',
        id: data.subMenuId || null,
        code: data.subMenuCode || '',
        name: data.subMenuName,
        icon: data.subMenuIcon || 'pi pi-circle',
        url: data.subMenuUrl || '',
        description: data.subMenuDescription || '',
        order: data.subMenuOrder || 1,
        isActive: data.subMenuIsActive ?? true,
        parentId: data.menuId || null,
        privilegeIds: data.privilegeIds || []
      };
    }
  }

  clearConfigForm(): void {
    this.configForm = {
      type: this.configForm.type, // keep current mode type
      id: null,
      code: '',
      name: '',
      icon: this.configForm.type === 'menu' ? 'pi pi-folder' : 'pi pi-circle',
      url: '',
      description: '',
      order: (this.configForm.type === 'menu' ? this.menus.length : this.subMenus.length) + 1,
      isActive: true,
      parentId: this.configForm.type === 'submenu' && this.menus.length > 0 ? this.menus[0].menuId || this.menus[0].slNo || null : null,
      privilegeIds: []
    };
    this.selectedNode = null;
  }

  saveNode(): void {
    if (!this.configForm.name.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please provide a valid name' });
      return;
    }

    if (this.configForm.type === 'menu') {
      const payload: MenuItem = {
        slNo: this.configForm.id || undefined,
        menuId: this.configForm.id || undefined,
        menuCode: this.configForm.code || undefined,
        name: this.configForm.name.trim(),
        description: this.configForm.description.trim(),
        url: this.configForm.url.trim() || undefined,
        icon: this.configForm.icon,
        order: this.configForm.order,
        isActive: this.configForm.isActive
      };

      this.menuService.saveMenu(payload).subscribe({
        next: (saved) => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Navigation section saved successfully' });
          this.menuMappingService.refreshMenu();
          this.addActivity('Saved', 'Navigation Section', `Configured "${payload.name}"`);
          this.loadAllData();
          this.clearConfigForm();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save navigation section' })
      });
    } else {
      if (!this.configForm.parentId) {
        this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please select a parent navigation section' });
        return;
      }
      const payload: SubmenuItem = {
        subMenuId: this.configForm.id || undefined,
        subMenuCode: this.configForm.code || undefined,
        subMenuName: this.configForm.name.trim(),
        subMenuDescription: this.configForm.description.trim(),
        subMenuUrl: this.configForm.url.trim(),
        subMenuIcon: this.configForm.icon,
        subMenuOrder: this.configForm.order,
        subMenuIsActive: this.configForm.isActive,
        menuId: this.configForm.parentId,
        privilegeIds: this.configForm.privilegeIds.length ? this.configForm.privilegeIds : this.getDefaultPrivilegeIds()
      };

      this.subMenuService.saveSubmenu(payload).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Page link saved successfully' });
          this.menuMappingService.refreshMenu();
          this.addActivity('Saved', 'Page Link', `Configured "${payload.subMenuName}"`);
          this.loadAllData();
          this.clearConfigForm();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save page link' })
      });
    }
  }

  deleteNode(type: 'menu' | 'submenu', node: any): void {
    if (!confirm(`Are you sure you want to delete this ${type === 'menu' ? 'navigation section' : 'page link'}?`)) {
      return;
    }

    if (type === 'menu') {
      const code = node.menuCode || '';
      this.menuService.deleteMenu(code).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Menu deleted successfully' });
          this.menuMappingService.refreshMenu();
          this.addActivity('Deleted', 'Navigation Section', `Removed "${node.name}"`);
          this.loadAllData();
          this.clearConfigForm();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to delete menu' })
      });
    } else {
      const code = node.subMenuCode || '';
      this.subMenuService.deleteSubmenu(code).subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Submenu deleted successfully' });
          this.menuMappingService.refreshMenu();
          this.addActivity('Deleted', 'Page Link', `Removed "${node.subMenuName}"`);
          this.loadAllData();
          this.clearConfigForm();
        },
        error: (err) => this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to delete submenu' })
      });
    }
  }

  moveNodeUp(type: 'menu' | 'submenu', node: any, event: Event): void {
    event.stopPropagation();
    if (type === 'menu') {
      const idx = this.menuTree.findIndex(m => m.menuId === node.menuId);
      if (idx > 0) {
        this.reorderMenu(idx, idx - 1);
      }
    } else {
      const parent = this.menuTree.find(m => m.menuId === node.menuId);
      if (parent) {
        const idx = parent.children.findIndex((sub: any) => sub.subMenuId === node.subMenuId);
        if (idx > 0) {
          this.reorderSubMenu(parent, idx, idx - 1);
        }
      }
    }
  }

  moveNodeDown(type: 'menu' | 'submenu', node: any, event: Event): void {
    event.stopPropagation();
    if (type === 'menu') {
      const idx = this.menuTree.findIndex(m => m.menuId === node.menuId);
      if (idx >= 0 && idx < this.menuTree.length - 1) {
        this.reorderMenu(idx, idx + 1);
      }
    } else {
      const parent = this.menuTree.find(m => m.menuId === node.menuId);
      if (parent) {
        const idx = parent.children.findIndex((sub: any) => sub.subMenuId === node.subMenuId);
        if (idx >= 0 && idx < parent.children.length - 1) {
          this.reorderSubMenu(parent, idx, idx + 1);
        }
      }
    }
  }

  startMenuDrag(index: number, event: DragEvent): void {
    this.draggedSubMenu = null;
    this.draggedMenuIndex = index;
    event.dataTransfer?.setData('text/plain', 'menu');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    event.stopPropagation();
  }

  allowMenuDrop(event: DragEvent): void {
    if (this.draggedMenuIndex === null || this.draggedSubMenu) {
      return;
    }
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  dropMenu(targetIndex: number, event: DragEvent): void {
    if (this.draggedMenuIndex === null || this.draggedSubMenu) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.reorderMenu(this.draggedMenuIndex, targetIndex);
    this.endDrag();
  }

  startSubMenuDrag(parentMenuId: number, index: number, event: DragEvent): void {
    this.draggedMenuIndex = null;
    this.draggedSubMenu = { parentMenuId, index };
    event.dataTransfer?.setData('text/plain', 'submenu');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
    event.stopPropagation();
  }

  allowSubMenuDrop(parentMenuId: number, event: DragEvent): void {
    if (!this.draggedSubMenu || this.draggedSubMenu.parentMenuId !== parentMenuId) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  dropSubMenu(parentMenuId: number, targetIndex: number, event: DragEvent): void {
    if (!this.draggedSubMenu || this.draggedSubMenu.parentMenuId !== parentMenuId) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const parent = this.menuTree.find(m => m.menuId === parentMenuId);
    if (parent) {
      this.reorderSubMenu(parent, this.draggedSubMenu.index, targetIndex);
    }
    this.endDrag();
  }

  endDrag(): void {
    this.draggedMenuIndex = null;
    this.draggedSubMenu = null;
  }

  private reorderMenu(fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) {
      return;
    }
    const [menu] = this.menuTree.splice(fromIndex, 1);
    this.menuTree.splice(toIndex, 0, menu);
    this.persistMenuTreeSequence('Navigation section order saved');
  }

  private reorderSubMenu(parent: any, fromIndex: number, toIndex: number): void {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || !parent?.children) {
      return;
    }
    const [subMenu] = parent.children.splice(fromIndex, 1);
    parent.children.splice(toIndex, 0, subMenu);
    this.persistMenuTreeSequence('Page link order saved');
  }

  private normalizeTreeOrders(): void {
    this.menuTree.forEach((menu, menuIndex) => {
      menu.order = menuIndex + 1;
      (menu.children || []).forEach((subMenu: any, subMenuIndex: number) => {
        subMenu.subMenuOrder = subMenuIndex + 1;
      });
    });
  }

  private buildSequencePayload(): MenuOrder[] {
    return this.menuTree.map(m => ({
      menuId: m.menuId,
      menuName: m.name,
      menuCode: m.menuCode,
      menuOrder: m.order,
      subMenus: (m.children || []).map((sub: any) => ({
        subMenuId: sub.subMenuId,
        subMenuName: sub.subMenuName,
        subMenuCode: sub.subMenuCode,
        subMenuOrder: sub.subMenuOrder
      }))
    }));
  }

  private persistMenuTreeSequence(detail: string): void {
    this.normalizeTreeOrders();
    this.savingSequence = true;
    this.menuSequenceService.saveMenuSequence(this.buildSequencePayload()).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Sequence Saved', detail });
        this.menuMappingService.refreshMenu();
        this.addActivity('Reordered', 'Navigation', detail);
        this.savingSequence = false;
        this.loadAllData();
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save navigation sequence' });
        this.savingSequence = false;
        this.loadAllData();
      }
    });
  }

  // ============================================================================
  // ACCESS CONTROL ACTIONS
  // ============================================================================
  onAccessControlRoleChange(roleId: number): void {
    this.selectedRolePrivileges.clear();
    this.loadingRolePrivileges = true;
    this.roleMenuMappingService.getRoleMenuPrivileges(roleId).subscribe({
      next: mappings => {
        mappings.forEach(mapping => {
          this.selectedRolePrivileges.set(mapping.subMenuId, new Set(mapping.privilegeIds));
        });
        this.rolePermissionCounts.set(roleId, this.countPrivileges(mappings));
        this.loadingRolePrivileges = false;
        if (this.moduleExpandedState.size === 0) {
          this.menuTree.slice(0, 3).forEach(m => this.moduleExpandedState.set('module-' + m.menuId, true));
        }
      },
      error: () => {
        this.loadingRolePrivileges = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load privilege mapping' });
      }
    });
  }

  isAccessChecked(subMenuId: number, privilegeId: number): boolean {
    return this.selectedRolePrivileges.get(subMenuId)?.has(privilegeId) ?? false;
  }

  selectAccessRole(role: Role): void {
    if (!role.roleId) {
      return;
    }
    this.selectedRoleId = role.roleId;
    this.onAccessControlRoleChange(role.roleId);
  }

  toggleAccessPrivilege(subMenuId: number, privilegeId: number, checked: boolean): void {
    if (!this.selectedRolePrivileges.has(subMenuId)) {
      this.selectedRolePrivileges.set(subMenuId, new Set<number>());
    }
    const set = this.selectedRolePrivileges.get(subMenuId)!;
    if (checked) {
      set.add(privilegeId);
    } else {
      set.delete(privilegeId);
      if (set.size === 0) {
        this.selectedRolePrivileges.delete(subMenuId);
      }
    }
  }

  toggleModuleGroup(menu: any, checked: boolean): void {
    (menu.children || []).forEach((sub: any) => {
      if (!this.selectedRolePrivileges.has(sub.subMenuId)) {
        this.selectedRolePrivileges.set(sub.subMenuId, new Set<number>());
      }
      const set = this.selectedRolePrivileges.get(sub.subMenuId)!;
      if (checked) {
        this.getRoutePrivileges(sub).forEach(privilege => set.add(privilege.privilegeId));
      } else {
        this.selectedRolePrivileges.delete(sub.subMenuId);
      }
    });
  }

  isModuleFullyChecked(menu: any): boolean {
    if (!menu.children?.length) return false;
    return menu.children.every((sub: any) => {
      const set = this.selectedRolePrivileges.get(sub.subMenuId);
      const privileges = this.getRoutePrivileges(sub);
      return privileges.length > 0 && set && privileges.every(privilege => set.has(privilege.privilegeId));
    });
  }

  getSelectedPermissionsCount(roleId: number | null): number {
    if (!roleId) return 0;
    let count = 0;
    this.selectedRolePrivileges.forEach((set) => {
      count += set.size;
    });
    return count;
  }

  saveAccessMappings(): void {
    if (!this.selectedRoleId) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please select a Role' });
      return;
    }

    const subMenuPrivileges = Array.from(this.selectedRolePrivileges.entries())
      .map(([subMenuId, privilegeIds]) => ({
        subMenuId,
        privilegeIds: Array.from(privilegeIds)
      }))
      .filter(entry => entry.privilegeIds.length > 0);

    const payload = {
      roleId: this.selectedRoleId,
      subMenuPrivileges
    };

    this.savingAccessControl = true;
    this.roleMenuMappingService.assignRoleMenuPrivileges(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Access Control Updated', detail: 'Privilege matrices written successfully' });
        this.menuMappingService.refreshMenu();
        const roleName = this.roles.find(r => r.roleId === this.selectedRoleId)?.roleName || 'Role';
        this.addActivity('Updated', 'Privilege', `Modified dynamic privilege grid for ${roleName}`);
        this.loadRolePermissionCounts();
        this.savingAccessControl = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'An error occurred during writes' });
        this.savingAccessControl = false;
      }
    });
  }

  // ============================================================================
  // ROLE MANAGEMENT ACTIONS
  // ============================================================================
  openAddRoleDialog(): void {
    this.roleFormEditMode = false;
    this.roleForm = {
      roleId: null,
      roleCode: '',
      roleName: '',
      description: '',
      isActive: true
    };
    this.roleFormVisible = true;
  }

  openEditRoleDialog(role: any): void {
    this.roleFormEditMode = true;
    this.roleForm = {
      roleId: role.roleId || null,
      roleCode: role.roleCode || '',
      roleName: role.roleName,
      description: role.description || '',
      isActive: role.isActive ?? true
    };
    this.roleFormVisible = true;
  }

  saveRole(): void {
    if (!this.roleForm.roleName.trim() || !this.roleForm.description.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Name and description are required' });
      return;
    }

    this.roleSaving = true;
    const payload: Role = {
      roleId: this.roleForm.roleId || undefined,
      roleCode: this.roleForm.roleCode || undefined,
      roleName: this.roleForm.roleName.trim(),
      description: this.roleForm.description.trim(),
      isActive: this.roleForm.isActive
    };

    this.roleService.saveOrUpdateRole(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: `Role "${payload.roleName}" saved successfully` });
        this.addActivity(this.roleFormEditMode ? 'Updated' : 'Created', 'Role', `Configured dynamic system role "${payload.roleName}"`);
        this.loadAllData();
        this.roleFormVisible = false;
        this.roleSaving = false;
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.message || 'Failed to save role' });
        this.roleSaving = false;
      }
    });
  }

  toggleRoleStatus(role: any): void {
    this.roleService.updateStatus(role.roleId, !role.isActive).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Status Updated', detail: 'Role active toggle applied' });
        this.addActivity('Toggled', 'Role', `Changed active status on ${role.roleName}`);
        this.loadAllData();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update role status' })
    });
  }

  // ============================================================================
  // OTHER UTILITIES
  // ============================================================================
  openSelectorIconPicker(): void {
    this.searchIconQuery = '';
    this.showIconPicker = true;
  }

  selectIcon(iconClass: string): void {
    this.configForm.icon = iconClass;
    this.showIconPicker = false;
  }

  getFilteredIcons(): IconDef[] {
    if (!this.searchIconQuery.trim()) {
      return this.popularIcons;
    }
    const q = this.searchIconQuery.toLowerCase();
    return this.popularIcons.filter(ic => ic.name.toLowerCase().includes(q) || ic.class.toLowerCase().includes(q) || ic.category.toLowerCase().includes(q));
  }

  getRoleAccent(role: Role): string {
    const seed = String(role.roleCode || role.roleName || role.roleId || 'role');
    const hash = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return this.roleAccentPalette[hash % this.roleAccentPalette.length];
  }

  getRoleBadgeStyle(role: Role): Record<string, string> {
    const accent = this.getRoleAccent(role);
    return {
      color: accent,
      background: `${accent}1a`,
      border: `1px solid ${accent}33`
    };
  }

  getDefaultPrivilegeIds(): number[] {
    return this.privilegesList
      .map((privilege: any) => privilege.privilegeId)
      .filter((privilegeId: any): privilegeId is number => typeof privilegeId === 'number');
  }

  get filteredRoles(): Role[] {
    const query = this.searchRoleQuery.trim().toLowerCase();
    if (!query) {
      return this.roles;
    }
    return this.roles.filter(role =>
      [role.roleName, role.roleCode, role.description]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(query))
    );
  }

  get activeMenusCount(): number {
    return this.menus.filter(menu => menu.isActive !== false).length;
  }

  get activeSubMenusCount(): number {
    return this.subMenus.filter(subMenu => subMenu.subMenuIsActive !== false).length;
  }

  get activeRolesCount(): number {
    return this.roles.filter(role => role.isActive !== false).length;
  }

  get workspaceBrandName(): string {
    const currentOrgId = this.loginService.getCurrentOrganizationId();
    const organizations = this.loginService.getOrganizations();
    const organization = organizations.find(org => String(org.orgId || org.id) === String(currentOrgId)) || organizations[0];
    return organization?.brandName || organization?.orgName || organization?.name || 'Current Workspace';
  }

  getRolePermissionCount(roleId?: number): number {
    if (!roleId) return 0;
    if (this.selectedRoleId === roleId && !this.loadingRolePrivileges) {
      return this.getSelectedPermissionsCount(roleId);
    }
    return this.rolePermissionCounts.get(roleId) || 0;
  }

  getRoutePrivileges(routeRow: any): { privilegeId: number; privilegeName: string }[] {
    const routePrivileges = routeRow?.privileges || [];
    if (routePrivileges.length) {
      return routePrivileges.map((privilege: any) => ({
        privilegeId: privilege.privilegeId,
        privilegeName: privilege.privilegeName
      }));
    }
    return this.privilegesList.map((privilege: any) => ({
      privilegeId: privilege.privilegeId,
      privilegeName: privilege.privilegeName
    }));
  }

  getPrivilegeDistribution(): PermissionDistributionItem[] {
    const total = Array.from(this.privilegeUsageCounts.values()).reduce((sum, count) => sum + count, 0);
    const classNames = ['view', 'create', 'edit', 'delete', 'approve'];
    return this.privilegesList.map((privilege: any, index) => {
      const count = this.privilegeUsageCounts.get(privilege.privilegeId) || 0;
      return {
        privilegeId: privilege.privilegeId,
        name: privilege.privilegeName,
        count,
        percentage: total ? Math.round((count / total) * 100) : 0,
        className: classNames[index] || 'view'
      };
    }).filter(item => item.count > 0);
  }

  getCurrentUserName(): string {
    const user = this.loginService.getUser();
    const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
    return fullName || user?.userName || 'Current User';
  }

  getModuleTitle(menuName: string): string {
    return menuName;
  }

  isModuleExpanded(menuId: number): boolean {
    return this.moduleExpandedState.get('module-' + menuId) ?? false;
  }

  toggleModuleExpansion(menuId: number): void {
    const key = 'module-' + menuId;
    this.moduleExpandedState.set(key, !this.moduleExpandedState.get(key));
  }

  addActivity(action: string, entity: string, details: string): void {
    this.activities.unshift({
      id: Date.now(),
      action,
      entity,
      details,
      user: this.getCurrentUserName(),
      time: 'Just now',
      severity: action === 'Deleted' ? 'danger' : action === 'Saved' || action === 'Created' ? 'success' : 'info'
    });
    this.activities = this.activities.slice(0, 10);
  }

  navigateToExternalRoute(route: string): void {
    this.router.navigate([route]);
  }
}