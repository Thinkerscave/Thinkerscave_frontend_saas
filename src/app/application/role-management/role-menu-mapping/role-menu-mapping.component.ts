import { Component } from '@angular/core';
import { MenuService } from '../../services/menu.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TreeNode } from 'primeng/api';
import { TreeModule } from 'primeng/tree';
import { PRIMENG_STANDALONE_IMPORTS } from '../../../shared/primeng';

@Component({
  selector: 'app-role-menu-mapping',
  imports: [...PRIMENG_STANDALONE_IMPORTS,TreeModule,FormsModule,CommonModule],
  templateUrl: './role-menu-mapping.component.html',
  styleUrl: './role-menu-mapping.component.scss'
})
export class RoleMenuMappingComponent {
  roles = [
    { label: 'Admin', value: 'admin' },
    { label: 'Student', value: 'student' },
    { label: 'Teacher', value: 'teacher' }
  ];
  selectedRole: any = null;

  menuTree: TreeNode[] = [];
  selectedNodes: TreeNode[] = [];

  constructor(private menuService: MenuService) {}

  ngOnInit() {
    this.menuTree = this.menuService.getMenuTree();
  }

  submit() {
    console.log('Selected Role:', this.selectedRole);
    console.log('Selected Menus:', this.selectedNodes);
    // TODO: Send to backend
  }
}
