import { Component } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeNode, MessageService } from 'primeng/api';
import { TreeModule } from 'primeng/tree';
import { ToastModule } from 'primeng/toast';
import { PRIMENG_STANDALONE_IMPORTS } from '../../../shared/primeng';
import { RoleMenuMappingService } from '../../services/role-menu-mapping.service';
import { RoleService } from '../../services/role.service';

@Component({
  selector: 'app-role-menu-mapping',
  imports: [...PRIMENG_STANDALONE_IMPORTS, TreeModule, ToastModule, FormsModule, CommonModule],
  providers: [MessageService],
  templateUrl: './role-menu-mapping.component.html',
  styleUrl: './role-menu-mapping.component.scss'
})
export class RoleMenuMappingComponent {
  roles: any[] = [];
  selectedRole: any = null;

  menuTree: TreeNode[] = [];
  selectedNodes: TreeNode[] = [];

  constructor(
    private roleMenuMappingService: RoleMenuMappingService,
    private roleService: RoleService,
    private messageService: MessageService
  ) { }

  ngOnInit() {
    this.loadRoles();
    this.roleMenuMappingService.getActiveMenuTree().subscribe((data: any[]) => {
      this.menuTree = data.map(menu => ({
        key: 'menu-' + menu.menuId,
        label: menu.menuName,
        selectable: true,
        expanded: true,
        children: menu.subMenus.map((sub: any) => ({
          key: 'submenu-' + sub.subMenuId,
          label: sub.subMenuName,
          data: { url: sub.subMenuUrl },
          selectable: true,
          children: sub.privileges.map((p: any) => ({
            // 🔑 unique key: submenu + privilege
            key: `privilege-${sub.subMenuId}-${p.privilegeId}`,
            label: p.privilegeName,
            selectable: true,
            data: { privilegeId: p.privilegeId, subMenuId: sub.subMenuId }
          }))
        }))
      }));
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

  submit() {
    if (!this.selectedRole) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Please select a role' });
      return;
    }

    const subMenuPrivileges: { subMenuId: number, privilegeIds: number[] }[] = [];

    // Collect selected submenus & privileges
    this.selectedNodes.forEach(node => {
      if (node.key?.startsWith("submenu-")) {
        const subMenuId = +node.key.replace("submenu-", "");
        const privilegeIds: number[] = [];

        node.children?.forEach(child => {
          if (child.key?.startsWith("privilege-")) {
            privilegeIds.push(child.data.privilegeId);
          }
        });

        subMenuPrivileges.push({ subMenuId, privilegeIds });
      }

      if (node.key?.startsWith("privilege-")) {
        const { subMenuId, privilegeId } = node.data;
        let existing = subMenuPrivileges.find(s => s.subMenuId === subMenuId);
        if (!existing) {
          existing = { subMenuId, privilegeIds: [] };
          subMenuPrivileges.push(existing);
        }
        if (!existing.privilegeIds.includes(privilegeId)) {
          existing.privilegeIds.push(privilegeId);
        }
      }
    });

    const payload = {
      roleId: this.selectedRole,
      subMenuPrivileges
    };

    this.roleMenuMappingService.assignRoleMenuPrivileges(payload).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Privileges assigned successfully' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Error while assigning privileges' });
      }
    });
  }
}
