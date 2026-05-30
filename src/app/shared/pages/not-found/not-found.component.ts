import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, ButtonModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <span class="not-found-code">404</span>
        <h1>Page Not Found</h1>
        <p>The page you're looking for doesn't exist or has been moved.</p>
        <button pButton routerLink="/app" label="Go to Dashboard" icon="pi pi-home" class="p-button-rounded"></button>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: var(--surface-ground);
    }
    .not-found-content {
      text-align: center;
      padding: 2rem;
    }
    .not-found-code {
      font-size: 8rem;
      font-weight: 800;
      line-height: 1;
      color: var(--primary-color);
      opacity: 0.15;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--text-color);
      margin: 0.5rem 0;
    }
    p {
      color: var(--text-color-secondary);
      margin-bottom: 2rem;
    }
  `]
})
export class NotFoundComponent {}
