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

@Component({
  selector: 'app-login',
  imports: [CommonModule,
    RouterModule,
    FormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    DividerModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  username = '';
  password = '';

  constructor(private router: Router, private loginService: LoginService) { }

  login() {
    const loginPayload = {
      username: this.username,
      password: this.password
    };
    this.loginService.generateToken(loginPayload).subscribe({
      next: (res: any) => {
        this.loginService.loginUser(res.token);
        console.log(res);
      },
      error: (e) => {
        console.error(e);
        alert("Invalid Details !! Try again");
      },
      complete: () => {
        console.log("complete");
        this.router.navigate(['/app']);
      }
    });
  }
}
