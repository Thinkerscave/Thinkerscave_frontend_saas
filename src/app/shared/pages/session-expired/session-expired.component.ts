import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { LoginService } from '../../../core/services/login.service';
import { OrganizationContextService } from '../../../core/services/organization-context.service';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';

@Component({
  selector: 'app-session-expired',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [ButtonModule, EmptyStateComponent],
  templateUrl: './session-expired.component.html',
  styleUrl: './session-expired.component.scss'
})
export class SessionExpiredComponent {
  private readonly router = inject(Router);
  private readonly loginService = inject(LoginService);
  private readonly orgContext = inject(OrganizationContextService);

  redirectLogin(): void {
    // Clear stale access/refresh state so org-select/login APIs do not
    // immediately 401 → refresh-fail → bounce back here.
    this.loginService.clearTokens();
    this.orgContext.clearSelectedOrganization();

    const target = this.orgContext.requiresSelection
      ? ['/auth/select-organization']
      : ['/auth/login'];
    this.router.navigate(target);
  }
}
