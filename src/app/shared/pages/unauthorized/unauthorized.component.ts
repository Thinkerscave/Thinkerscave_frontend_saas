import { Component } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Shown when a logged-in user navigates to a route they lack permissions for.
 * roleGuard redirects here with router.navigate(['/unauthorized']).
 */
@Component({
    selector: 'app-unauthorized',
    standalone: true,
    template: `
    <div class="unauthorized-container">
      <div class="unauthorized-card">
        <div class="icon">🔒</div>
        <h1>Access Denied</h1>
        <p>You do not have permission to view this page.</p>
        <p class="sub">Please contact your administrator if you think this is a mistake.</p>
        <button (click)="goBack()">← Go Back</button>
      </div>
    </div>
  `,
    styles: [`
    .unauthorized-container {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      background: #f5f7fa;
      font-family: 'Inter', sans-serif;
    }
    .unauthorized-card {
      background: white;
      border-radius: 16px;
      padding: 3rem 4rem;
      text-align: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      max-width: 420px;
    }
    .icon { font-size: 4rem; margin-bottom: 1rem; }
    h1 { color: #1a1a2e; margin: 0 0 0.5rem; font-size: 1.8rem; }
    p { color: #555; margin: 0 0 0.5rem; }
    .sub { font-size: 0.85rem; color: #aaa; margin-bottom: 2rem; }
    button {
      background: #4f46e5;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-size: 0.95rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    button:hover { background: #4338ca; }
  `]
})
export class UnauthorizedComponent {
    constructor(private router: Router) { }

    goBack(): void {
        this.router.navigate(['/app']);
    }
}
