import { Injectable, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackNavigationService } from '../../../core/services/back-navigation.service';

/** Back navigation that returns to the page that opened the current screen. */
@Injectable({ providedIn: 'root' })
export class AdmissionsNavService {
  private readonly router = inject(Router);
  private readonly nav = inject(BackNavigationService);

  readonly fallbacks: Record<string, string> = {
    overview: '/app/admissions/overview',
    leads: '/app/admissions/leads',
    'follow-ups': '/app/admissions/follow-ups',
    applications: '/app/admissions/applications',
    settings: '/app/admissions/settings'
  };

  back(route: ActivatedRoute, fallback = '/app/admissions/leads'): void {
    this.nav.back({ fallback, route, fromMap: this.fallbacks });
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
