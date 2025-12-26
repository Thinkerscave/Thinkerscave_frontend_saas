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

  constructor(private router: Router, private loginService: LoginService, private messageService: MessageService) { }

  ngOnInit(): void {
    // Clear local storage every time the login page is loaded
    this.loginService.logOut();
  }

  login() {
    const trimmedUsername = this.username.trim().toLowerCase();
    console.log('[LOGIN COMPONENT] Login attempt with username:', trimmedUsername);

    // Check if this is a counsellor login attempt
    if (trimmedUsername === 'counsellor') {
      console.log('[LOGIN COMPONENT] Detected counsellor login - using mock data');
      this.counsellorLogin();
      return;
    }

    console.log('[LOGIN COMPONENT] Attempting regular backend login with:', trimmedUsername);

    const loginPayload = {
      username: this.username,
      password: this.password
    };

    this.loginService.generateToken(loginPayload).subscribe({
      next: (res: any) => {
        console.log('[LOGIN COMPONENT] Backend login response:', res);

        const accessToken = res.accessToken || res.token;
        const refreshToken = res.refreshToken;

        if (!accessToken) {
          console.error('[LOGIN COMPONENT] No access token found in response');
          this.messageService.add({
            severity: 'error',
            summary: 'Login Error',
            detail: 'Authentication failed: No access token received',
            life: 5000
          });
          return;
        }

        // 1. Store token
        this.loginService.loginUser(accessToken, refreshToken);
        console.log('[LOGIN COMPONENT] Tokens stored. Access Token:', accessToken ? 'Yes' : 'No');

        // 2. Fetch current user details
        console.log('[LOGIN COMPONENT] Fetching current user details...');
        this.loginService.getCurrentUser().subscribe({
          next: (user: any) => {
            console.log('[LOGIN COMPONENT] User details fetched:', user);
            this.loginService.setUser(user);

            // 3. Redirect based on firstTimeLogin
            if (user.firstTimeLogin) {
              console.log('[LOGIN COMPONENT] First time login detected, redirecting...');
              this.router.navigate(['/auth/first-time-login']);
            } else {
              console.log('[LOGIN COMPONENT] Redirecting to app dashboard...');
              this.router.navigate(['/app']);
            }
          },
          error: (err) => {
            console.error("[LOGIN COMPONENT] Failed to fetch user details", err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to retrieve user details. Please try again.',
              life: 5000
            });
          }
        });
      },
      error: (e) => {
        console.error('[LOGIN COMPONENT] Backend login error:', e);
        this.messageService.add({
          severity: 'error',
          summary: 'Login Failed',
          detail: 'Invalid username or password or server error',
          life: 5000
        });
      }
    });
  }

  /**
   * Quick counsellor login with hardcoded credentials
   */
  counsellorQuickLogin() {
    console.log('[LOGIN COMPONENT] Quick counsellor login initiated');
    this.username = 'counsellor';
    this.password = 'Counsellor@123';

    // Directly call the counsellor login without form submission
    this.counsellorLogin();
  }

  /**
   * Counsellor login with mock credentials
   */
  private counsellorLogin() {
    const trimmedUsername = this.username.trim().toLowerCase();
    const trimmedPassword = this.password.trim();

    console.log('[LOGIN COMPONENT] Starting counsellor login with:', trimmedUsername);
    this.loginService.counsellorLogin(trimmedUsername, trimmedPassword).subscribe({
      next: (res: any) => {
        console.log('[LOGIN COMPONENT] Counsellor login response:', res);

        if (res.error) {
          console.error('[LOGIN COMPONENT] Login error:', res.message);
          this.messageService.add({
            severity: 'error',
            summary: 'Login Failed',
            detail: res.message || 'Invalid credentials',
            life: 5000
          });
          return;
        }

        console.log('[LOGIN COMPONENT] Login successful, storing tokens...');

        // 1. Store tokens
        this.loginService.loginUser(res.accessToken, res.refreshToken);

        // 2. Store user data
        this.loginService.setUser(res.user);

        console.log('[LOGIN COMPONENT] Tokens and user stored, showing success message...');

        // 3. Navigate to counsellor dashboard
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Login successful!',
          life: 2000
        });

        console.log('[LOGIN COMPONENT] Navigating to counsellor dashboard...');

        setTimeout(() => {
          this.router.navigate(['/app/counsellor-dashboard']);
        }, 500);
      },
      error: (err) => {
        console.error('[LOGIN COMPONENT] Counsellor login error:', err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'An error occurred during login',
          life: 5000
        });
      }
    });
  }
}
