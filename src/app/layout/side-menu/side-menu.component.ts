import { Component } from '@angular/core';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-side-menu',
  imports: [PanelMenuModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent {
  items: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/app'
    },
    {
      label: 'Menu Management',
      icon: 'pi pi-bars',
      items: [
        { label: 'Manage Menu', routerLink: '/app/manage-menu' },
        { label: 'Manage Sub-menu', routerLink: '/app/manage-sub-menu' },
        { label: 'Menu Sequence', routerLink: '/app/menu-sequence' }
      ]
    },
    {
      label: 'Role Management',
      icon: 'pi pi-lock',
      items: [
        { label: 'Manage Role', routerLink: '/app/role/manage' },
        { label: 'Role-Menu Mapping', routerLink: '/app/role/menu-mapping' },
        { label: 'Role-Privilege Mapping', routerLink: '/app/role/privilege-mapping' }
      ]
    },
    {
      label: 'Organization Management',
      icon: 'pi pi-building',
      items: [
        { label: 'Manage Organization', routerLink: '/app/organization-registration' }
      ]
    },
    {
      label: 'Student Management',
      icon: 'pi pi-users',
      items: [
        { label: 'Manage Student', routerLink: '/app/managestudent' }
      ]
    },
    {
      label: 'Staff Management',
      icon: 'pi pi-id-card',
      items: [
        { label: 'Manage Staff', routerLink: '/app/staff' },
        { label: 'Manage Salary', routerLink: '/app/salary' },
        { label: 'Leave Management', routerLink: '/app/leave' }
      ]
    },
    {
      label: 'Attendance Management',
      icon: 'pi pi-calendar',
      items: [
        { label: 'Class Attendance', routerLink: '/app/attendance/class' },
        { label: 'Hostel Attendance', routerLink: '/app/attendance/hostel' },
        { label: 'Staff Attendance', routerLink: '/app/attendance/staff' }
      ]
    }
  ];

}
