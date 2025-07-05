import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { DividerModule } from 'primeng/divider';
import { FloatLabelModule } from 'primeng/floatlabel';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-forgot-password',
  imports: [CommonModule,
    RouterModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    DividerModule, CheckboxModule, FloatLabelModule, ToastModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  providers: [MessageService]
})
export class ForgotPasswordComponent {
  step: number = 1;

  username: string = '';
  otp: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  constructor(private router: Router, private messageService: MessageService) { }

  // Step 1: Send OTP
  sendOtp() {
    if (!this.username) return;
    // Simulate backend call
    this.messageService.add({
      severity: 'success',
      summary: 'OTP Sent',
      detail: `OTP sent to mobile number ending with 1234`,
      life: 3000
    });
    this.step = 2;
  }

  // Step 2: Verify OTP
  verifyOtp() {
    if (this.otp === '123456') {
      this.step = 3;
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid OTP',
        detail: 'Please enter a valid OTP',
        life: 3000
      });
    }
  }

  // Step 3: Submit new password
  resetPassword() {
    if (this.newPassword !== this.confirmPassword) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Password Mismatch',
        detail: 'New and confirm password must match',
        life: 3000
      });
      return;
    }

    // Simulate reset password success
    this.messageService.add({
      severity: 'success',
      summary: 'Password Updated',
      detail: 'You will be redirected to login',
      life: 3000
    });

    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 3000);
  }

  resendOtp() {
    // Simulate another OTP being sent
    this.messageService.add({
      severity: 'info',
      summary: 'OTP Resent',
      detail: `OTP has been resent to your registered mobile number.`,
      life: 3000
    });

    // Optional: reset otp input field
    this.otp = '';
  }
}
