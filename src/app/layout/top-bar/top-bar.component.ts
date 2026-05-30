import { Component, EventEmitter, Input, Output, inject , ChangeDetectionStrategy} from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { MenuModule } from 'primeng/menu';
import { ButtonModule } from 'primeng/button';
import { LoginService } from '../../core/services/login.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../shared/theme/theme.service';
import { InitialsPipe } from '../../shared/pipes';
import { GlobalSearchComponent } from '../../shared/components/global-search/global-search.component';


@Component({
  selector: 'app-top-bar',
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MenuModule, ButtonModule, CommonModule, InitialsPipe, GlobalSearchComponent],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.scss'
})
export class TopBarComponent {
  private readonly themeService = inject(ThemeService);

  userName: string = '';
  profileItems: MenuItem[] = [];
  readonly themeMode = this.themeService.themeMode;
  readonly isDarkTheme = this.themeService.isDarkTheme;

  @Input() isSidebarExpanded = false;
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(
    private loginService: LoginService,
    private router: Router,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    const user = this.loginService.getUser();
    if (user) {
      const first = user.firstName || '';
      const last = user.lastName || '';
      // Show full name if available, fall back to username
      this.userName = (first + ' ' + last).trim() || user.userName || 'User';
    }

    this.profileItems = [
      {
        label: 'Profile',
        icon: 'pi pi-user-edit',
        command: () => this.router.navigate(['/app/profile'])
      },
      {
        label: 'Settings',
        icon: 'pi pi-cog',
        command: () => this.router.navigate(['/app/settings'])
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

  onToggleSidebar(): void {
    this.toggleSidebar.emit();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
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
