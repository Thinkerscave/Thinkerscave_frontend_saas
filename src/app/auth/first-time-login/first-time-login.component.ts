import { CommonModule } from '@angular/common';
import { Component, OnInit , ChangeDetectionStrategy} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { LoginService } from '../../core/services/login.service';

@Component({
  selector: 'app-first-time-login',
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PasswordModule, CommonModule, FormsModule, ToastModule, ButtonModule, RouterModule],
  templateUrl: './first-time-login.component.html',
  styleUrl: './first-time-login.component.scss'
})
export class FirstTimeLoginComponent implements OnInit {
  username: string = '';
  currentPassword: string = '';
  newPassword: string = '';
  retypePassword: string = '';
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private messageService: MessageService,
    private loginService: LoginService
  ) { }

  ngOnInit(): void {
    // Pre-fill username from stored user data if available
    const user = this.loginService.getUser();
    if (user?.userName) {
      this.username = user.userName;
    }
  }

  save() {
    if (!this.currentPassword || !this.currentPassword.trim()) {
      this.messageService.add({
        severity: 'error',
        summary: 'Current Password Required',
        detail: 'Enter your temporary password to continue.'
      });
      return;
    }

    if (!this.newPassword || this.newPassword.trim().length < 6) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid Password',
        detail: 'New password must be at least 6 characters.'
      });
      return;
    }

    if (this.newPassword !== this.retypePassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Mismatch',
        detail: 'New password and confirmation do not match.'
      });
      return;
    }

    this.isLoading = true;

    // Call backend PATCH /api/v1/users/changePassword
    this.loginService.changePassword(this.currentPassword, this.newPassword, this.retypePassword).subscribe({
      next: () => {
        this.isLoading = false;
        const user = this.loginService.getUser();
        if (user) {
          this.loginService.setUser({ ...user, firstTimeLogin: false });
        }
        this.messageService.add({
          severity: 'success',
          summary: 'Password Updated',
          detail: 'Password changed successfully.'
        });
        setTimeout(() => {
          this.router.navigate(['/app/onboarding']);
        }, 2000);
      },
      error: (err: any) => {
        this.isLoading = false;
        const msg = err?.error?.message || err?.error || 'Failed to change password. Please try again.';
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: msg
        });
      }
    });
  }
}
