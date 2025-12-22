import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';

@Component({
  selector: 'app-session-expired',
  imports: [CardModule,ButtonModule],
  templateUrl: './session-expired.component.html',
  styleUrl: './session-expired.component.scss'
})
export class SessionExpiredComponent {
  constructor(private router: Router) {}

  redirectLogin() {
    this.router.navigate(['/login']);
  }
}
