import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

/**
 * Premium KPI/metric card used across dashboards.
 *
 * Inputs:
 *  - label  — short caption rendered above the value
 *  - value  — primary metric, accepts number or string (formatted by caller)
 *  - icon   — PrimeIcon class (e.g. "pi pi-users") or material/feather name
 *  - tone   — semantic palette: default | success | warning | danger | info
 *  - delta  — optional percentage change shown beside the value
 *  - hint   — optional secondary line of text
 *  - link / linkLabel — optional CTA at bottom-right
 *  - loading — when true, renders a shimmer placeholder
 */
@Component({
  selector: 'app-kpi-card',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule],
  templateUrl: './kpi-card.component.html',
  styleUrls: ['./kpi-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiCardComponent {
  @Input() label = '';
  @Input() value: string | number | null = null;
  @Input() icon = 'pi pi-chart-line';
  @Input() tone: 'default' | 'success' | 'warning' | 'danger' | 'info' = 'default';
  @Input() delta: number | null = null;
  @Input() hint: string | null = null;
  @Input() link: string | any[] | null = null;
  @Input() linkLabel = 'View';
  @Input() loading = false;

  get deltaSign(): 'up' | 'down' | 'flat' {
    if (this.delta === null || this.delta === undefined) return 'flat';
    if (this.delta > 0) return 'up';
    if (this.delta < 0) return 'down';
    return 'flat';
  }

  get deltaLabel(): string {
    if (this.delta === null || this.delta === undefined) return '';
    const sign = this.delta > 0 ? '+' : '';
    return `${sign}${this.delta.toFixed(1)}%`;
  }
}
