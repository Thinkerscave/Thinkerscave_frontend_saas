import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, viewChild, signal } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { LoginService } from '../../core/services/login.service';
import { IdleTimeoutService } from '../../core/services/idle-timeout.service';
import { TenantConfigService } from '../../core/services/tenant-config.service';
import { OrganizationContextService } from '../../core/services/organization-context.service';
import { UserInfo } from '../../shared/models/auth.model';
import { ForgotPasswordModalComponent } from '../components/forgot-password-modal/forgot-password-modal.component';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ForgotPasswordModalComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly loginService = inject(LoginService);
  private readonly messageService = inject(MessageService);
  private readonly loader = inject(NgxUiLoaderService);
  private readonly idleTimeoutService = inject(IdleTimeoutService);
  private readonly tenantConfigService = inject(TenantConfigService);
  private readonly orgContext = inject(OrganizationContextService);

  readonly forgotModal = viewChild.required(ForgotPasswordModalComponent);
  readonly submitting = signal(false);

  readonly selectedOrg = this.orgContext.getSelectedOrganization();

  loginForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  ngOnInit(): void {
    if (this.orgContext.requiresSelection && !this.orgContext.getSelectedOrganization()) {
      this.router.navigate(['/auth/select-organization']);
      return;
    }
    this.loginService.prepareLoginScreen();
  }

  openForgotPassword(): void {
    this.forgotModal().open();
  }

  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { username, password, rememberMe } = this.loginForm.value;
    this.submitting.set(true);
    this.loader.start('login-flow');

    this.loginService.generateToken({
      usernameOrEmail: username,
      password,
      rememberMe: !!rememberMe,
      deviceName: 'ThinkersCave Web'
    }).subscribe({
      next: (res: any) => {
        const loginData = res?.data ?? res;
        const accessToken = loginData.accessToken || loginData.token;
        const refreshToken = loginData.refreshToken || loginData.token;
        const loginUser = loginData.user;

        if (!accessToken) {
          this.finishSubmit();
          this.messageService.add({
            severity: 'error',
            summary: 'Login Error',
            detail: 'Authentication failed: No access token received',
            life: 5000
          });
          return;
        }

        this.loginService.loginUser(
          accessToken,
          refreshToken,
          loginData.tenantId,
          loginUser?.orgType,
          loginUser?.organizations,
          rememberMe
        );

        const mappedUser = this.loginService.mapAuthUser(loginUser, loginData.firstTimeLogin);
        if (mappedUser) {
          this.loginService.setUser(mappedUser);
        }

        if (!this.loginService.getCurrentOrganizationId() && this.selectedOrg) {
          this.loginService.setCurrentOrganization(String(this.selectedOrg.id));
        }

        this.tenantConfigService.fetchConfigFromServer().subscribe({
          next: () => this.redirectUser(mappedUser ?? this.loginService.getUser()!),
          error: () => this.redirectUser(mappedUser ?? this.loginService.getUser()!)
        });
      },
      error: (e: any) => {
        this.finishSubmit();
        const errorMessage = e.error?.message || e.error?.detail || 'Invalid username or password';
        this.messageService.add({
          severity: 'error',
          summary: 'Login Failed',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  private finishSubmit(): void {
    this.submitting.set(false);
    this.loader.stop('login-flow');
  }

  private redirectUser(user: UserInfo): void {
    this.finishSubmit();
    if (user.firstTimeLogin) {
      this.router.navigate(['/auth/first-time-login']);
      return;
    }
    this.idleTimeoutService.start();
    this.router.navigate(['/app']);
  }
}
