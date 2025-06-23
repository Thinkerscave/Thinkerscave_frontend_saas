import { Component } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { MenuModule } from 'primeng/menu';


@Component({
  selector: 'app-top-bar',
  imports: [MenuModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  userName = 'Soumya';
  profileItems: MenuItem[] = [
    { label: 'View Profile', icon: 'pi pi-id-card', routerLink: '/profile' },
    { label: 'Change Password', icon: 'pi pi-lock', routerLink: '/change-password' },
    { label: 'Sign Out', icon: 'pi pi-sign-out', command: () => this.signOut() }
  ];

  signOut() {
    // Logic here
  }
}
