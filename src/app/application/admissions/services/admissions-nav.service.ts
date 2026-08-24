import { Injectable, inject } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

/** Back navigation that returns to the page that opened the current screen. */
@Injectable({ providedIn: 'root' })
export class AdmissionsNavService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly fallbacks: Record<string, string> = {
    overview: '/app/admissions/overview',
    leads: '/app/admissions/leads',
    'follow-ups': '/app/admissions/follow-ups',
    applications: '/app/admissions/applications',
    settings: '/app/admissions/settings'
  };

  back(route: ActivatedRoute, fallback = '/app/admissions/leads'): void {
    const from = route.snapshot.queryParamMap.get('from');
    const mapped = from ? this.fallbacks[from] : null;
    if (mapped) {
      void this.router.navigateByUrl(mapped);
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl(fallback);
  }

  toLead(inquiryId: number, from: string): void {
    void this.router.navigate(['/app/admissions/lead', inquiryId], { queryParams: { from } });
  }

  toApplication(applicationId: number | 'new', from?: string): void {
    void this.router.navigate(
      ['/app/admissions/form', applicationId],
      from ? { queryParams: { from } } : {}
    );
  }
}
