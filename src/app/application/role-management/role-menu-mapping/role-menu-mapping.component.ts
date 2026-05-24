import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { PRIMENG_STANDALONE_IMPORTS } from '../../../shared/primeng';
import { RoleMenuMappingService } from '../../services/role-menu-mapping.service';
import { RoleService } from '../../services/role.service';
import { CheckboxModule } from 'primeng/checkbox';
import { MenuMappingService } from '../../services/menu-mapping.service';

type MenuGridRow = {
  menuId: number;
  menuName: string;
  subMenuId: number;
  subMenuName: string;
  privileges: {
    privilegeId: number;
    privilegeName: string;
  }[];
};

@Component({
  selector: 'app-role-menu-mapping',
  imports: [...PRIMENG_STANDALONE_IMPORTS, ToastModule, FormsModule, CommonModule, CheckboxModule],
  providers: [MessageService],
  templateUrl: './role-menu-mapping.component.html',
  styleUrl: './role-menu-mapping.component.scss'
})
export class RoleMenuMappingComponent {
  roles: any[] = [];
  selectedRole: any = null;

  menuGridRows: MenuGridRow[] = [];
  selectedPrivileges = new Map<number, Set<number>>();
  loadingTree = false;
  loadingRolePrivileges = false;
  saving = false;

  constructor(
    private roleMenuMappingService: RoleMenuMappingService,
    private roleService: RoleService,
    private menuMappingService: MenuMappingService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.loadRoles();
    this.loadMenuTree();
  }

  loadMenuTree() {
    this.loadingTree = true;
    this.roleMenuMappingService.getActiveMenuTree().subscribe((data: any[]) => {
      this.menuGridRows = (data || []).flatMap(menu =>
        (menu.subMenus || []).map((sub: any) => ({
          menuId: menu.menuId,
          menuName: menu.menuName,
          subMenuId: sub.subMenuId,
          subMenuName: sub.subMenuName,
          privileges: sub.privileges.map((p: any) => ({
            privilegeId: p.privilegeId,
            privilegeName: p.privilegeName
          }))
        }))
      );
      this.selectedPrivileges.clear();
      this.loadingTree = false;
    }, () => {
      this.loadingTree = false;
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load menu tree' });
    });
  }

  loadRoles() {
    this.roleService.getActiveRoles().subscribe((data: any[]) => {
      this.roles = data.map(role => ({
        label: role.roleName,
        value: role.roleId
      }));
    });
  }

  onRoleChange(roleId: number): void {
    this.selectedPrivileges.clear();
    if (!roleId) {
      return;
    }

    this.loadingRolePrivileges = true;
    this.roleMenuMappingService.getRoleMenuPrivileges(roleId).subscribe({
      next: mappings => {
        mappings.forEach(mapping => {
          this.selectedPrivileges.set(mapping.subMenuId, new Set(mapping.privilegeIds));
        });
        this.loadingRolePrivileges = false;
      },
      error: () => {
        this.loadingRolePrivileges = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load existing role privileges' });
      }
    });
  }

  submit() {
    if (!this.selectedRole) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please select a role' });
      return;
    }

    const subMenuPrivileges = Array.from(this.selectedPrivileges.entries())
      .map(([subMenuId, privilegeIds]) => ({
        subMenuId,
        privilegeIds: Array.from(privilegeIds)
      }))
      .filter(entry => entry.privilegeIds.length > 0);

    const payload = {
      roleId: this.selectedRole,
      subMenuPrivileges
    };

    this.saving = true;
    this.roleMenuMappingService.assignRoleMenuPrivileges(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Privileges assigned successfully' });
        this.menuMappingService.refreshMenu();
        this.saving = false;
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error while assigning privileges' });
        this.saving = false;
      }
    });
  }

  isPrivilegeSelected(subMenuId: number, privilegeId: number): boolean {
    return this.selectedPrivileges.get(subMenuId)?.has(privilegeId) ?? false;
  }

  togglePrivilege(subMenuId: number, privilegeId: number, checked: boolean): void {
    const set = this.ensurePrivilegeSet(subMenuId);
    if (checked) {
      set.add(privilegeId);
    } else {
      set.delete(privilegeId);
      if (set.size === 0) {
        this.selectedPrivileges.delete(subMenuId);
      }
    }
  }

  toggleSubMenu(row: MenuGridRow, checked: boolean): void {
    if (!row.privileges.length) {
      return;
    }

    const set = this.ensurePrivilegeSet(row.subMenuId);
    if (checked) {
      row.privileges.forEach(priv => set.add(priv.privilegeId));
    } else {
      row.privileges.forEach(priv => set.delete(priv.privilegeId));
      if (set.size === 0) {
        this.selectedPrivileges.delete(row.subMenuId);
      }
    }
  }

  isSubMenuFullySelected(row: MenuGridRow): boolean {
    const set = this.selectedPrivileges.get(row.subMenuId);
    if (!set || !row.privileges.length) {
      return false;
    }
    return row.privileges.every(priv => set.has(priv.privilegeId));
  }

  isSubMenuPartiallySelected(row: MenuGridRow): boolean {
    const set = this.selectedPrivileges.get(row.subMenuId);
    if (!set || !row.privileges.length) {
      return false;
    }
    const selectedCount = row.privileges.filter(priv => set.has(priv.privilegeId)).length;
    return selectedCount > 0 && selectedCount < row.privileges.length;
  }

  private ensurePrivilegeSet(subMenuId: number): Set<number> {
    if (!this.selectedPrivileges.has(subMenuId)) {
      this.selectedPrivileges.set(subMenuId, new Set<number>());
    }
    return this.selectedPrivileges.get(subMenuId)!;
  }
}
