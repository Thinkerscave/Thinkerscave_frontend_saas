import { Component , ChangeDetectionStrategy} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-public-layout',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="public-layout">
      <header class="public-header">
        <span class="logo-text">ThinkerScave</span>
      </header>
      <main class="public-content">
        <router-outlet></router-outlet>
      </main>
      <footer class="public-footer">
        &copy; 2026 ThinkerScave. All rights reserved.
      </footer>
    </div>
  `,
  styles: [`
    .public-layout {
      min-height: 100vh;
      background-color: #f8fafc;
      display: flex;
      flex-direction: column;
    }
    .public-header {
      padding: 1rem 2rem;
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,.08);
    }
    .logo-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: #4F46E5;
    }
    .public-content {
      flex: 1;
      max-width: 1200px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem 1rem;
    }
    .public-footer {
      padding: 1rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.875rem;
    }
  `]
})
export class PublicLayoutComponent { }
