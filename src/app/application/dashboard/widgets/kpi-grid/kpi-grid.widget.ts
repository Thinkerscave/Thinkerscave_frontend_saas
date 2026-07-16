import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { KpiGridData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-kpi-grid-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-kpi-grid">
      <article class="w-kpi" *ngFor="let item of data.items" [attr.data-tone]="item.tone || 'primary'">
        <span class="w-kpi__icon"><i class="pi" [ngClass]="item.icon || 'pi-chart-bar'"></i></span>
        <div class="w-kpi__body">
          <span class="w-kpi__label">{{ item.label }}</span>
          <span class="w-kpi__value">{{ item.value }}</span>
          <span class="w-kpi__trend" *ngIf="item.trendPercent !== null && item.trendPercent !== undefined" [attr.data-up]="item.trendPercent >= 0">
            <i class="pi" [ngClass]="item.trendPercent >= 0 ? 'pi-arrow-up' : 'pi-arrow-down'"></i>
            {{ item.trendLabel || (item.trendPercent + '%') }}
          </span>
        </div>
        <i class="pi pi-eye w-kpi__sample" *ngIf="item.sample" title="Preview data"></i>
      </article>
    </div>
  `
})
export class KpiGridWidgetComponent {
  @Input({ required: true }) data!: KpiGridData;
}
