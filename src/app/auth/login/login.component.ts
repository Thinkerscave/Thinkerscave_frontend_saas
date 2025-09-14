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

  login() {
    const loginPayload = {
      username: this.username,
      password: this.password
    };
    // if (this.firstTimeLogin) {
    //   // Save data if needed
    //   localStorage.setItem('username', this.username);
    //   this.router.navigate(['/auth/first-time-login']);
    // }
    this.loginService.generateToken(loginPayload).subscribe({
      next: (res: any) => {
        this.loginService.loginUser(res.token);
        this.router.navigate(['/app']);
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
