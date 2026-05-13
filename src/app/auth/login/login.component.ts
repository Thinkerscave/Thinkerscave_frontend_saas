import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { LoginService } from '../../services/login.service';
import { CheckboxModule } from 'primeng/checkbox';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { IdleTimeoutService } from '../../core/services/idle-timeout.service';
import { TenantConfigService } from '../../services/tenant-config.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule,
    RouterModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    DividerModule, CheckboxModule, FloatLabelModule, ToastModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  password = '';
  rememberMe: boolean = false;
  firstTimeLogin: boolean = true;

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
    const trimmedUsername = this.username.trim().toLowerCase();
    console.log('[LOGIN COMPONENT] Login attempt with username:', trimmedUsername);

    console.log('[LOGIN COMPONENT] Attempting regular backend login with:', trimmedUsername);

    const loginPayload = {
      userName: this.username,
      password: this.password
    };

    this.loader.start('login-flow');

    this.loginService.generateToken(loginPayload).subscribe({
      next: (res: any) => {
        console.log('[LOGIN COMPONENT] Backend login response:', res.data);

        const accessToken = res.data.accessToken || res.data.token;
        const refreshToken = res.data.refreshToken;

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
        this.loginService.loginUser(accessToken, refreshToken, res.tenantId, res.user?.orgType, res.user?.organizations, this.rememberMe);
        console.log('[LOGIN COMPONENT] Tokens stored. Access Token:', accessToken ? 'Yes' : 'No');

        // 2. Fetch current user details
        console.log('[LOGIN COMPONENT] Fetching current user details...');
        this.loginService.getCurrentUser().subscribe({
          next: (res: any) => {
            // Backend wraps response in ApiResponse<T>: { success, message, data: {...} }
            const user = res?.data ?? res;
            console.log('[LOGIN COMPONENT] User details fetched:', user);
            this.loginService.setUser(user);

            // 3. Fetch Tenant Config
            this.tenantConfigService.fetchConfigFromServer().subscribe({
              next: () => this.redirectUser(user),
              error: (err) => {
                console.error('[LOGIN COMPONENT] Failed to fetch tenant config', err);
                this.redirectUser(user);
              }
            });
          },
          error: (err: any) => {
            console.error('[LOGIN COMPONENT] Error fetching user details:', err);
            this.loader.stop('login-flow');
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to retrieve user details. Please try again.',
              life: 5000
            });
          }
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

  private redirectUser(user: any) {
    this.loader.stop('login-flow');
    if (user.firstTimeLogin) {
      console.log('[LOGIN COMPONENT] First time login detected, redirecting to /auth/first-time-login...');
      this.router.navigate(['/auth/first-time-login']).then(success => {
        console.log('[LOGIN COMPONENT] Navigation to first-time-login result:', success);
        if (!success) {
          console.error('[LOGIN COMPONENT] Navigation failed!');
          this.messageService.add({ severity: 'error', summary: 'Navigation Error', detail: 'Could not redirect to first time login page.' });
        }
      });
    } else {
      console.log('[LOGIN COMPONENT] Redirecting to app dashboard...');
      this.idleTimeoutService.start();
      this.router.navigate(['/app']).then(success => {
        console.log('[LOGIN COMPONENT] Navigation to app dashboard result:', success);
      });
    }
  }

}

