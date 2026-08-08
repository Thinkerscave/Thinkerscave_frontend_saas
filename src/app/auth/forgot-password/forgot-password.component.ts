import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { LoginService } from '../../core/services/login.service';

@Component({
  selector: 'app-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule,
    RouterModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    DividerModule, CheckboxModule, FloatLabelModule, ToastModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);

  step = 1;

  emailForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  otpForm: FormGroup = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
  });

  passwordForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  // Inject your service to make API calls
  constructor(
    private router: Router,
    private messageService: MessageService,
    private loginService: LoginService // Assuming password methods are in LoginService
  ) {}

  /**
   * Step 1: Calls the backend to send an OTP to the provided email.
   */
  sendOtp() {
    if (this.emailForm.invalid) {
      this.showError('Please enter a valid email address.');
      return;
    }

    const email = this.emailForm.value.email;
    this.loginService.requestPasswordOtp(email).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'OTP Sent',
          detail: `An OTP has been sent to your email.`,
          life: 3000
        });
        this.step = 2; // Move to the next step
      },
      error: (err) => {
        // For security, still show a positive message even if the email doesn't exist
        this.messageService.add({
            severity: 'success',
            summary: 'OTP Sent',
            detail: `If an account exists, an OTP has been sent to your email.`,
            life: 3000
          });
        this.step = 2;
      }
    });
  }

  /**
   * Step 2: Calls the backend to verify the OTP.
   */
  verifyOtp() {
    if (this.otpForm.invalid) {
        this.showError('Please enter the OTP.');
        return;
    }
    const email = this.emailForm.value.email;
    const otp = this.otpForm.value.otp;
    this.loginService.verifyPasswordOtp(email, otp).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'OTP Verified',
          detail: 'You can now set a new password.',
          life: 2000
        });
        this.step = 3; // OTP is correct, move to the final step
      },
      error: (err) => {
        this.showError(err.error?.message || 'Invalid or expired OTP.');
      }
    });
  }

  /**
   * Step 3: Calls the backend to reset the password with the new credentials.
   */
  resetPassword() {
    if (this.passwordForm.value.newPassword !== this.passwordForm.value.confirmPassword) {
      this.showError('Passwords do not match.');
      return;
    }
    if (this.passwordForm.invalid) {
        this.showError('Please enter a valid new password.');
        return;
    }

    const payload = {
      email: this.emailForm.value.email,
      otp: this.otpForm.value.otp,
      newPassword: this.passwordForm.value.newPassword,
      confirmPassword: this.passwordForm.value.confirmPassword
    };

    this.loginService.resetPasswordWithOtp(payload).subscribe({
      next: (response) => {
        this.messageService.add({
          severity: 'success',
          summary: 'Password Updated',
          detail: 'Your password has been changed. Redirecting to login...',
          life: 3000
        });
        setTimeout(() => this.router.navigate(['/auth/login']), 3000);
      },
      error: (err) => {
        this.showError(err.error?.message || 'Could not reset password. The OTP may have expired.');
      }
    });
  }

  /**
   * Resends the OTP by calling the sendOtp method again.
   */
  resendOtp() {
    this.sendOtp();
  }

  private showError(message: string) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: message,
      life: 3000
    });
  }
}
