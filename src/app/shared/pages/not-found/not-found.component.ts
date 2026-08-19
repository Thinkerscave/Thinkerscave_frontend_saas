import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { LoginService } from '../../../core/services/login.service';
import { workspaceHomeForUser } from '../../../core/utils/workspace-home';

@Component({
  selector: 'app-not-found',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule, ButtonModule, EmptyStateComponent],
  template: `
    <div class="tc-error-shell">
      <div class="tc-error-shell__card">
        <app-empty-state
          [page]="true"
          illustration="notFound"
          title="Page not found"
          message="The page you're looking for doesn't exist or has been moved."
          actionLabel="Go to Dashboard"
          actionIcon="pi pi-home"
          (action)="goHome()">
        </app-empty-state>
      </div>
    </div>
  `,
  styles: [`
    .tc-error-shell {
      min-height: 100vh;
      display: grid;
      place-items: center;
      padding: 2rem 1.25rem;
      background:
        radial-gradient(circle at top right, color-mix(in srgb, var(--tc-accent, #16a34a) 16%, transparent), transparent 42%),
        linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
    }
    .tc-error-shell__card {
      width: min(100%, 28rem);
      padding: 2.25rem 1.75rem;
      border-radius: 1.25rem;
      background: color-mix(in srgb, white 92%, transparent);
      border: 1px solid color-mix(in srgb, var(--tc-accent, #16a34a) 14%, #e2e8f0);
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
    }
  `]
})
export class NotFoundComponent {
  private readonly router = inject(Router);
  private readonly loginService = inject(LoginService);

  goHome(): void {
    this.router.navigateByUrl(workspaceHomeForUser(this.loginService.getUser(), this.loginService.getLoginContext() === 'PLATFORM'));
  }
}
