import { Location } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Canonical back navigation: honour an explicit `from` query when mapped,
 * otherwise return to the previous in-app history entry, otherwise the fallback list.
 */
@Injectable({ providedIn: 'root' })
export class BackNavigationService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  back(options: {
    fallback: string | string[];
    route?: ActivatedRoute;
    fromMap?: Record<string, string>;
  }): void {
    const from = options.route?.snapshot.queryParamMap.get('from');
    if (from && options.fromMap?.[from]) {
      void this.router.navigateByUrl(options.fromMap[from]);
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }
    const fallback = options.fallback;
    void this.router.navigate(Array.isArray(fallback) ? fallback : [fallback]);
  }
}
