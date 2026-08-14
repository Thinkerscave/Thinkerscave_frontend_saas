import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, viewChild, signal, NgZone } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { LoginService } from '../../core/services/login.service';
import { IdleTimeoutService } from '../../core/services/idle-timeout.service';
import { TenantConfigService } from '../../core/services/tenant-config.service';
import { OrganizationContextService } from '../../core/services/organization-context.service';
import { MenuMappingService } from '../../application/services/menu-mapping.service';
import { PermissionService } from '../../core/services/permission.service';
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
  private readonly ngZone = inject(NgZone);
  private readonly loginService = inject(LoginService);
  private readonly messageService = inject(MessageService);
  private readonly loader = inject(NgxUiLoaderService);
  private readonly idleTimeoutService = inject(IdleTimeoutService);
  private readonly tenantConfigService = inject(TenantConfigService);
  private readonly orgContext = inject(OrganizationContextService);
  private readonly menuMapping = inject(MenuMappingService);
  private readonly permissionService = inject(PermissionService);

  readonly forgotModal = viewChild.required(ForgotPasswordModalComponent);
  readonly submitting = signal(false);
  readonly showPassword = signal(false);

  private readonly tips = [
    'Use Ctrl+K anywhere to open global search across students, staff, and classes.',
    'Pin your most-used pages from Settings to keep everyday workflows one click away.',
    'Switch organizations from the top bar without signing out again.',
    'Set an accent color in Settings so your workspace matches your brand.',
    'Bulk import students with the CSV template from Student Directory.'
  ];

  readonly dailyTip = this.tips[new Date().getDate() % this.tips.length];

  get loginTarget() {
    return this.orgContext.getLoginTarget();
  }

  get isPlatformLogin() {
    return this.orgContext.isPlatformLogin();
  }

  loginForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  ngOnInit(): void {
    if (this.orgContext.requiresSelection && !this.orgContext.hasLoginTarget()) {
      this.router.navigate(['/auth/select-organization']);
      return;
    }
    this.loginService.prepareLoginScreen();
  }

  openForgotPassword(): void {
    this.forgotModal().open();
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((visible) => !visible);
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
          loginData.refreshToken ?? null,
          loginData.tenantId,
          loginUser?.orgType,
          loginUser?.organizations,
          rememberMe,
          loginData.loginContext === 'PLATFORM' ? 'PLATFORM' : 'TENANT'
        );

        // Pass accessToken explicitly so orgId is read from JWT (user DTO has no organizationId).
        const mappedUser = this.loginService.mapAuthUser(loginUser, loginData.firstTimeLogin, accessToken);
        if (mappedUser) {
          this.loginService.setUser(mappedUser);
        }

        if (this.isPlatformLogin) {
          this.loginService.setTenant(loginData.tenantId || 'public');
          // JWT orgId is source of truth; never trust orgId=0 from mapped user (`??` does not skip 0).
          const platformOrgId =
            this.loginService.toPositiveOrgId(this.loginService.getOrgIdFromAccessToken(accessToken))
            ?? this.loginService.toPositiveOrgId(mappedUser?.organizationId)
            ?? this.loginService.toPositiveOrgId(mappedUser?.orgId)
            ?? this.loginService.toPositiveOrgId(this.loginTarget?.id);
          if (platformOrgId) {
            this.loginService.setCurrentOrganization(String(platformOrgId));
          }
        } else if (!this.loginService.getCurrentOrganizationId() && this.loginTarget) {
          this.loginService.setCurrentOrganization(String(this.loginTarget.id));
          this.loginService.setTenant(loginData.tenantId || this.loginTarget.tenantId);
        }

        // Drop any previous user's in-memory sidebar/permissions before entering /app.
        this.menuMapping.clearMenuCache();
        this.permissionService.clearPermissions();

        // Navigate first so a slow/failing tenant-config call cannot strand the user on /auth/login.
        this.redirectUser(mappedUser ?? this.loginService.getUser()!);
        this.tenantConfigService.fetchConfigFromServer().subscribe({ error: () => void 0 });
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
    if (user?.firstTimeLogin) {
      this.finishSubmit();
      void this.router.navigateByUrl('/auth/first-time-login');
      return;
    }

    this.idleTimeoutService.start();

    const target = this.orgContext.isPlatformLogin()
      ? '/app/tenant-management/dashboard'
      : '/app';

    this.finishSubmit();

    this.ngZone.run(() => {
      void this.router.navigateByUrl(target, { replaceUrl: true }).then(
        (ok) => {
          if (!ok) {
            this.messageService.add({
              severity: 'warn',
              summary: 'Navigation blocked',
              detail: `Could not open ${target}. Check role permissions.`,
              life: 6000
            });
          }
        },
        (err) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Navigation failed',
            detail: String(err?.message ?? err ?? 'Unknown navigation error'),
            life: 8000
          });
        }
      );
    });
  }
}
