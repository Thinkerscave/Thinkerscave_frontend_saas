import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { SaasPageHeaderComponent, SaasStat, SaasStatGridComponent } from '../../../../shared/ui/saas/saas-primitives';
import { TcPageSkeletonComponent } from '../../../../shared/ui/loading/tc-page-skeleton.component';
import { FrontDeskApiService } from '../../front-desk-api.service';

@Component({
  selector: 'app-front-desk-overview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, SaasPageHeaderComponent, SaasStatGridComponent, TcPageSkeletonComponent, AppToastComponent],
  templateUrl: './front-desk-overview.component.html',
  styleUrls: ['../../front-desk.shared.scss', './front-desk-overview.component.scss']
})
export class FrontDeskOverviewComponent implements OnInit {
  private readonly api = inject(FrontDeskApiService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  error = '';
  stats: SaasStat[] = [];

  ngOnInit(): void {
    this.api.summary().subscribe({
      next: summary => {
        this.stats = [
          { key: '/app/front-desk/visitors/active', label: 'Visitors on campus', value: summary.visitorsOnCampus ?? 0, icon: 'pi pi-id-card', tone: 'primary' },
          { key: '/app/front-desk/appointments', label: "Today's appointments", value: summary.todaysAppointments ?? 0, icon: 'pi pi-calendar', tone: 'info' },
          { key: '/app/admissions/follow-ups', label: 'Pending follow-ups', value: summary.pendingFollowUps ?? 0, icon: 'pi pi-phone', tone: 'warning' },
          { key: '/app/front-desk/postal/outward', label: "Today's dispatches", value: summary.todaysDispatches ?? 0, icon: 'pi pi-send', tone: 'neutral' },
          { key: '/app/front-desk/inquiries', label: "Today's walk-ins", value: summary.todaysWalkIns ?? 0, icon: 'pi pi-user-plus', tone: 'success' }
        ];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Daily overview could not be loaded.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  open(stat: SaasStat): void {
    void this.router.navigateByUrl(stat.key);
  }
}
