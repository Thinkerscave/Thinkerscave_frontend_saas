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
    const loginPayload = {
      username: this.username,
      password: this.password
    };

    this.loginService.generateToken(loginPayload).subscribe({
      next: (res: any) => {
        // 1. Store token
        this.loginService.loginUser(res.accessToken,res.token);

        // 2. Fetch current user details
        this.loginService.getCurrentUser().subscribe({
          next: (user: any) => {
            this.loginService.setUser(user);

            // 3. Redirect based on firstTimeLogin
            if (user.firstTimeLogin) {
              this.router.navigate(['/auth/first-time-login']);
            } else {
              this.router.navigate(['/app']);
            }
          },
          error: (err) => {
            console.error("Failed to fetch user details", err);
            this.messageService.add({
              severity: 'error',
              summary: 'Error',
              detail: 'Failed to fetch user details',
              life: 5000
            });
          }
        });
      },
      error: (e) => {
        console.error(e);
        this.messageService.add({
          severity: 'error',
          summary: 'Login Failed',
          detail: 'Invalid username or password',
          life: 5000
        });
      }
    });
  }

}
