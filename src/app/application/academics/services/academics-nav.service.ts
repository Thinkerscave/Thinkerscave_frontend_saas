import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

/** Shared back navigation for Academics list/detail pages. */
@Injectable({ providedIn: 'root' })
export class AcademicsNavService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  back(route: ActivatedRoute, fallback: string | any[] = ['/app/academics/overview']): void {
    const from = route.snapshot.queryParamMap.get('from');
    if (from === 'overview') {
      void this.router.navigate(['/app/academics/overview']);
      return;
    }
    if (from === 'subjects') {
      void this.router.navigate(['/app/academics/subjects-mapping']);
      return;
    }
    if (from === 'classes') {
      void this.router.navigate(['/app/academics/classes-sections']);
      return;
    }
    if (from === 'calendar') {
      void this.router.navigate(['/app/academics/academic-calendar']);
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigate(Array.isArray(fallback) ? fallback : [fallback]);
  }
}
