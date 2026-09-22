import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigationHistoryService } from './navigation-history.service';
import { workspaceHomeForUser } from '../utils/workspace-home';
import { LoginService } from './login.service';

/**
 * Canonical in-app Back: previous history entry first, then a route fallback
 * for deep links that have no prior product screen.
 */
@Injectable({ providedIn: 'root' })
export class BackNavigationService {
  private readonly router = inject(Router);
  private readonly history = inject(NavigationHistoryService);
  private readonly loginService = inject(LoginService);

  back(options?: {
    fallback?: string | string[];
    route?: ActivatedRoute;
    /** @deprecated History is the source of truth; kept for existing callers. */
    fromMap?: Record<string, string>;
  }): void {
    const previous = this.history.consumePrevious();
    if (previous) {
      void this.router.navigateByUrl(previous);
      return;
    }

    const fallback = options?.fallback
      ?? (options?.route?.snapshot.data['backFallback'] as string | string[] | undefined)
      ?? this.routeBackFallback()
      ?? workspaceHomeForUser(
        this.loginService.getUser(),
        this.loginService.getLoginContext() === 'PLATFORM'
      );

    void this.router.navigate(Array.isArray(fallback) ? fallback : [fallback]);
  }

  private routeBackFallback(): string | string[] | null {
    let route = this.router.routerState.root;
    let fallback: string | string[] | null = null;
    while (route.firstChild) {
      route = route.firstChild;
      if (route.snapshot.data['backFallback']) {
        fallback = route.snapshot.data['backFallback'] as string | string[];
      }
    }
    return fallback;
  }
}
