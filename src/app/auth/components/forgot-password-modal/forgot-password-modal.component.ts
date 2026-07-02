import { Component, ChangeDetectionStrategy, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageService } from 'primeng/api';
import { LoginService } from '../../../core/services/login.service';

@Component({
  selector: 'app-forgot-password-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogModule,
    InputTextModule,
    PasswordModule,
    ButtonModule
  ],
  templateUrl: './forgot-password-modal.component.html',
  styleUrl: './forgot-password-modal.component.scss'
})
export class ForgotPasswordModalComponent {
  @Output() closed = new EventEmitter<void>();

  private readonly fb = inject(FormBuilder);
  private readonly loginService = inject(LoginService);
  private readonly messageService = inject(MessageService);

  readonly visible = signal(false);
  readonly step = signal(1);
  readonly loading = signal(false);

  emailForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  otpForm: FormGroup = this.fb.group({
    otp: ['', [Validators.required, Validators.minLength(4)]]
  });

  passwordForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  });

  open(): void {
    this.step.set(1);
    this.emailForm.reset();
    this.otpForm.reset();
    this.passwordForm.reset();
    this.visible.set(true);
  }

  close(): void {
    this.visible.set(false);
    this.closed.emit();
  }

  sendOtp(): void {
    if (this.emailForm.invalid) {
      this.showError('Please enter a valid email address.');
      return;
    }
    this.loading.set(true);
    const email = this.emailForm.value.email;
    this.loginService.requestPasswordOtp(email).subscribe({
      next: () => this.onOtpSent(),
      error: () => this.onOtpSent()
    });
  }

  verifyOtp(): void {
    if (this.otpForm.invalid) {
      this.showError('Please enter the OTP.');
      return;
    }
    this.loading.set(true);
    const email = this.emailForm.value.email;
    const otp = this.otpForm.value.otp;
    this.loginService.verifyPasswordOtp(email, otp).subscribe({
      next: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Verified', detail: 'Set your new password.', life: 2500 });
        this.step.set(3);
      },
      error: (err) => {
        this.loading.set(false);
        this.showError(err.error?.message || 'Invalid or expired OTP.');
      }
    });
  }

  resetPassword(): void {
    if (this.passwordForm.value.newPassword !== this.passwordForm.value.confirmPassword) {
      this.showError('Passwords do not match.');
      return;
    }
    if (this.passwordForm.invalid) {
      this.showError('Please enter a valid new password.');
      return;
    }
    this.loading.set(true);
    const payload = {
      email: this.emailForm.value.email,
      otp: this.otpForm.value.otp,
      newPassword: this.passwordForm.value.newPassword
    };
    this.loginService.resetPasswordWithOtp(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.messageService.add({ severity: 'success', summary: 'Password Updated', detail: 'You can sign in with your new password.', life: 3000 });
        this.close();
      },
      error: (err) => {
        this.loading.set(false);
        this.showError(err.error?.message || 'Could not reset password.');
      }
    });
  }

  resendOtp(): void {
    this.sendOtp();
  }

  private onOtpSent(): void {
    this.loading.set(false);
    this.messageService.add({
      severity: 'success',
      summary: 'OTP Sent',
      detail: 'If an account exists, an OTP has been sent to your email.',
      life: 3000
    });
    this.step.set(2);
  }

  private showError(message: string): void {
    this.messageService.add({ severity: 'error', summary: 'Error', detail: message, life: 3000 });
  }
}
