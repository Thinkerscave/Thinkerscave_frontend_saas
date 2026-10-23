import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, inject } from '@angular/core';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';
import { DashboardResponse, WelcomeHeaderData, WidgetDTO } from '../../models/dashboard.model';
import { WidgetHostComponent } from '../../widgets/widget-host.component';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, WidgetHostComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './staff-dashboard.component.html',
  styleUrl: './staff-dashboard.component.scss'
})
export class StaffDashboardComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) workspace!: DashboardResponse;
  @Output() retry = new EventEmitter<void>();
  @Output() refreshRequested = new EventEmitter<void>();
  private readonly pageHeader = inject(BreadCrumbService);

  get welcome(): WelcomeHeaderData {
    return this.widget('welcome-header')?.data as WelcomeHeaderData ?? {};
  }

  widget(key: string): WidgetDTO<any> | null {
    return this.workspace?.widgets?.find(item => item.widgetKey === key) ?? null;
  }

  trackRetry(widget: WidgetDTO<any>): void {
    this.retry.emit();
  }

  ngOnChanges(_changes: SimpleChanges): void {
    const welcome = this.welcome;
    const firstName = (welcome.displayName || 'Staff').trim().split(/\s+/)[0];
    const greeting = `${welcome.greeting || 'Welcome'}, ${firstName}!`;
    const context = "Here's your overview for today.";
    const rightLabel = welcome.todayLabel
      ? new Date(`${welcome.todayLabel}T12:00:00`).toLocaleDateString(undefined, {
          weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
        })
      : undefined;
    this.pageHeader.setPageHeader({ pageTitle: greeting, subtitle: context, hideBreadcrumb: true, rightLabel });
  }

  ngOnDestroy(): void {
    this.pageHeader.clearPageHeader();
  }
}