import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-first-time-login',
  imports: [PasswordModule,CommonModule,FormsModule,ToastModule,ButtonModule,RouterModule],
  templateUrl: './first-time-login.component.html',
  styleUrl: './first-time-login.component.scss'
})
export class FirstTimeLoginComponent {
  username: string = localStorage.getItem('username') || '';
  currentPassword: string = '';
  newPassword: string = '';
  retypePassword: string = '';

  constructor(private router: Router, private messageService: MessageService) { }

  save() {
    if (this.newPassword !== this.retypePassword) {
      this.messageService.add({
        severity: 'error',
        summary: 'Mismatch',
        detail: 'New password and confirmation do not match.'
      });
      return;
    }

    // Here, call your API to update password
    // e.g. this.loginService.updatePassword({ ... })

    this.messageService.add({
      severity: 'success',
      summary: 'Password Updated',
      detail: 'Please login with your new credentials.'
    });

    setTimeout(() => {
      this.router.navigate(['/auth/login']);
    }, 2000);
  }
}
