import { Component } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { LoginService } from '../../services/login.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-top-bar',
  imports: [MenuModule, CommonModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  userName: string = '';
  profileItems: MenuItem[] = [];

  constructor(
    private loginService: LoginService,
    private router: Router,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    const user = this.loginService.getUser();
    if (user) {
      this.userName = `${user.firstName} ${user.lastName}`;
    }

    this.profileItems = [
      {
        label: 'Profile',
        icon: 'pi pi-user-edit',
        command: () => this.router.navigate(['/profile'])
      },
      {
        label: 'Settings',
        icon: 'pi pi-cog',
        command: () => this.router.navigate(['/settings'])
      },
      {
        separator: true
      },
      {
        label: 'Logout',
        icon: 'pi pi-sign-out',
        command: () => this.logout()
      }
    ];
  }

  getInitials(name: string): string {
    const names = name.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    } else {
      return (names[0].charAt(0) + names[1].charAt(0)).toUpperCase();
    }
  }

  logout() {
    // Clear storage and redirect to login
    this.loginService.logOutAndRedirect();

    // Show success message
    this.messageService.add({
      severity: 'success',
      summary: 'Logged out',
      detail: 'You have been logged out successfully'
    });
  }

}
