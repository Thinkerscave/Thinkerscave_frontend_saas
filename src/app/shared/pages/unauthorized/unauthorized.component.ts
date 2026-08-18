import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { LoginService } from '../../../core/services/login.service';
import { OrganizationContextService } from '../../../core/services/organization-context.service';
import { resolveWorkspaceHome, roleTokensFromUser } from '../../../core/utils/workspace-home';

/**
 * Shown when a logged-in user navigates to a route they lack permissions for.
 * roleGuard redirects here with router.navigate(['/unauthorized']).
 */
@Component({
  selector: 'app-unauthorized',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ButtonModule, EmptyStateComponent],
  template: `
    <div class="tc-error-shell">
      <div class="tc-error-shell__card">
        <app-empty-state
          [page]="true"
          illustration="locked"
          title="Access denied"
          message="You do not have permission to view this page. Contact your administrator if you think this is a mistake."
          actionLabel="Go to Dashboard"
          actionIcon="pi pi-home"
          (action)="goBack()">
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
        radial-gradient(circle at top left, color-mix(in srgb, var(--tc-accent, #16a34a) 16%, transparent), transparent 42%),
        linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
    }
    .tc-error-shell__card {
      width: min(100%, 28rem);
      padding: 2.25rem 1.75rem;
      border-radius: 1.25rem;
      background: #fff;
      border: 1px solid color-mix(in srgb, var(--tc-accent, #16a34a) 14%, #e2e8f0);
      box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
    }
  `]
})
export class UnauthorizedComponent {
  private readonly router = inject(Router);
  private readonly loginService = inject(LoginService);
  private readonly orgContext = inject(OrganizationContextService);

  goBack(): void {
    void this.router.navigateByUrl(
      resolveWorkspaceHome(roleTokensFromUser(this.loginService.getUser()), this.orgContext.isPlatformLogin())
    );
  }
}
