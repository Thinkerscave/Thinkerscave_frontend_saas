import { Component } from '@angular/core';
import { DragDropModule } from 'primeng/dragdrop';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { OrderListModule } from 'primeng/orderlist';
import { SelectModule } from 'primeng/select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-menu-sequence',
  imports: [DragDropModule, CardModule, ButtonModule, OrderListModule, SelectModule, CommonModule, FormsModule],
  templateUrl: './menu-sequence.component.html',
  styleUrl: './menu-sequence.component.scss'
})
export class MenuSequenceComponent {
  menus = [
    {
      id: 2,
      label: 'Menu Management',
      order: 2,
      submenus: [
        { id: 21, label: 'Manage Menu', order: 1 },
        { id: 22, label: 'Manage Sub-menu', order: 2 },
        { id: 23, label: 'Menu Sequence', order: 3 }
      ]
    },
    {
      id: 3,
      label: 'Role Management',
      order: 3,
      submenus: [
        { id: 31, label: 'Manage Role', order: 1 },
        { id: 32, label: 'Role-Menu Mapping', order: 2 },
        { id: 33, label: 'Role-Privilege Mapping', order: 3 }
      ]
    },
    {
      id: 4,
      label: 'Organization Management',
      order: 4,
      submenus: [
        { id: 41, label: 'Manage Organization', order: 1 }
      ]
    },
    {
      id: 5,
      label: 'Student Management',
      order: 5,
      submenus: [
        { id: 51, label: 'Manage Student', order: 1 }
      ]
    },
    {
      id: 6,
      label: 'Staff Management',
      order: 6,
      submenus: [
        { id: 61, label: 'Manage Staff', order: 1 },
        { id: 62, label: 'Manage Salary', order: 2 },
        { id: 63, label: 'Leave Management', order: 3 }
      ]
    },
    {
      id: 7,
      label: 'Attendance Management',
      order: 7,
      submenus: [
        { id: 71, label: 'Class Attendance', order: 1 },
        { id: 72, label: 'Hostel Attendance', order: 2 },
        { id: 73, label: 'Staff Attendance', order: 3 }
      ]
    }
  ];


  selectedMenu: any = null;
  selectedSubmenus: any[] = [];
  activeMenuId: any;

  // OnInit: auto-select first menu that's not Dashboard
  ngOnInit() {
    // const firstMenu = this.menus.find(menu => menu.label !== 'Dashboard');
    this.onMenuClick(this.menus[0]);
  }


  onMenuChange() {
    this.selectedSubmenus = this.selectedMenu?.submenus || [];
  }

  onMenuReorder(event: any) {
    this.menus.forEach((menu, index) => menu.order = index + 1);
  }

  onSubMenuReorder(event: any) {
    this.selectedSubmenus.forEach((submenu, index) => submenu.order = index + 1);
  }

  submitOrder() {
    console.log('Menu Order:', this.menus);
    console.log('Submenu Order:', this.selectedSubmenus);
    // Here, make API call to update order in backend
  }

  onMenuClick(menu: any) {
    this.activeMenuId = menu.id;
    this.selectedSubmenus = [...menu.submenus];

  }
}
