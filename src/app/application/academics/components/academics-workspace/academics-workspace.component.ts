import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LoginService } from '../../../../core/services/login.service';
import { resolveAcademicsEntry, roleTokensFromUser } from '../../../../core/utils/workspace-home';

/**
 * Thin Academics shell — navigation lives in the app side menu only
 * (matches Organization / Customer UX; no duplicate top tabs).
 */
@Component({
  selector: 'app-academics-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="academics-workspace">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .academics-workspace {
      min-width: 0;
      animation: acad-shell-in 260ms var(--tc-anim-easing, cubic-bezier(0.22, 1, 0.36, 1));
    }
    @keyframes acad-shell-in {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class AcademicsWorkspaceComponent {}

/** `/app/academics` landing — students and teachers never hit admin Overview. */
@Component({
  selector: 'app-academics-index-redirect',
  standalone: true,
  template: ''
})
export class AcademicsIndexRedirectComponent {
  constructor() {
    const router = inject(Router);
    const login = inject(LoginService);
    void router.navigateByUrl(resolveAcademicsEntry(roleTokensFromUser(login.getUser())), { replaceUrl: true });
  }
}
