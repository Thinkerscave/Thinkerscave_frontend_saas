import { Injectable, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackNavigationService } from '../../../core/services/back-navigation.service';

/** Shared back navigation for Academics list/detail pages. */
@Injectable({ providedIn: 'root' })
export class AcademicsNavService {
  private readonly nav = inject(BackNavigationService);

  private readonly fromMap: Record<string, string> = {
    overview: '/app/academics/overview',
    subjects: '/app/academics/subjects-mapping',
    classes: '/app/academics/classes-sections',
    calendar: '/app/academics/academic-calendar'
  };

  back(route: ActivatedRoute, fallback: string | any[] = ['/app/academics/overview']): void {
    this.nav.back({ fallback, route, fromMap: this.fromMap });
  }
}
