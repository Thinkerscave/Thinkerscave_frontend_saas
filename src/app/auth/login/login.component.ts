import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { LoginService } from '../../core/services/login.service';
import { CheckboxModule } from 'primeng/checkbox';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { IdleTimeoutService } from '../../core/services/idle-timeout.service';
import { TenantConfigService } from '../../core/services/tenant-config.service';
import { UserInfo } from '../../shared/models/auth.model';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule,
    RouterModule,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    DividerModule, CheckboxModule, FloatLabelModule, ToastModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);

  loginForm: FormGroup = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    rememberMe: [false]
  });

  constructor(
    private router: Router,
    private loginService: LoginService,
    private messageService: MessageService,
    private loader: NgxUiLoaderService,
    private idleTimeoutService: IdleTimeoutService,
    private tenantConfigService: TenantConfigService
  ) { }

  ngOnInit(): void {
    // Clear local storage every time the login page is loaded
    this.loginService.logOut();
  }

  login() {
    if (this.loginForm.invalid) return;

    const { username, password, rememberMe } = this.loginForm.value;

    const loginPayload = {
      usernameOrEmail: username,
      password,
      rememberMe: !!rememberMe,
      deviceName: 'ThinkersCave Web'
    };

    this.loader.start('login-flow');

    this.loginService.generateToken(loginPayload).subscribe({
      next: (res: any) => {
        const loginData = res?.data ?? res;
        const accessToken = loginData.accessToken || loginData.token;
        const refreshToken = loginData.refreshToken || loginData.token;
        const loginUser = loginData.user;

        if (!accessToken) {
          console.error('[LOGIN COMPONENT] No access token found in response');
          this.loader.stop('login-flow');
          this.messageService.add({
            severity: 'error',
            summary: 'Login Error',
            detail: 'Authentication failed: No access token received',
            life: 5000
          });
          return;
        }

        // 1. Store token and tenant (pass rememberMe preference)
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

        // 2. Fetch tenant config then redirect
        this.tenantConfigService.fetchConfigFromServer().subscribe({
          next: () => this.redirectUser(mappedUser ?? this.loginService.getUser()!),
          error: () => this.redirectUser(mappedUser ?? this.loginService.getUser()!)
        });
      },
      error: (e: any) => {
        console.error('[LOGIN COMPONENT] Login generation error:', e);
        this.loader.stop('login-flow');

        // Extract error message from backend response or use default
        const errorMessage = e.error?.message || e.error?.detail || 'Invalid username or password or server error';

        this.messageService.add({
          severity: 'error',
          summary: 'Login Failed',
          detail: errorMessage,
          life: 5000
        });
      }
    });
  }

  private redirectUser(user: UserInfo) {
    this.loader.stop('login-flow');
    if (user.firstTimeLogin) {
      this.router.navigate(['/auth/first-time-login']).then(success => {
        if (!success) {
          this.messageService.add({ severity: 'error', summary: 'Navigation Error', detail: 'Could not redirect to first time login page.' });
        }
      });
    } else {
      this.idleTimeoutService.start();
      this.router.navigate(['/app']);
    }
  }

}

