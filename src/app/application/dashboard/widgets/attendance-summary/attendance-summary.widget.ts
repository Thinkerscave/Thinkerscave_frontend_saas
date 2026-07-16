import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AttendanceSummaryData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-attendance-summary-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-attendance">
      <div class="w-attendance__ring" [style.--pct]="data.percentage">
        <span>{{ data.percentage | number:'1.0-0' }}%</span>
      </div>
      <div class="w-attendance__stats">
        <span class="w-attendance__stat" data-tone="success"><i class="pi pi-circle-fill"></i>Present <strong>{{ data.presentCount }}</strong></span>
        <span class="w-attendance__stat" data-tone="danger"><i class="pi pi-circle-fill"></i>Absent <strong>{{ data.absentCount }}</strong></span>
        <span class="w-attendance__stat" data-tone="warning" *ngIf="data.lateCount">
          <i class="pi pi-circle-fill"></i>Late <strong>{{ data.lateCount }}</strong>
        </span>
        <span class="w-attendance__stat">Total <strong>{{ data.totalCount }}</strong></span>
      </div>
    </div>
  `
})
export class AttendanceSummaryWidgetComponent {
  @Input({ required: true }) data!: AttendanceSummaryData;
}
