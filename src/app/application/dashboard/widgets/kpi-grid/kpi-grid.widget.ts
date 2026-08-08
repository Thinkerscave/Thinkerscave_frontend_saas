import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject
} from '@angular/core';
import { KpiGridData, KpiItem } from '../../models/dashboard.model';

interface AnimatedKpi extends KpiItem {
  displayValue: string;
}

@Component({
  selector: 'tc-kpi-grid-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-kpi-grid">
      <article class="w-kpi" *ngFor="let item of animatedItems" [attr.data-tone]="item.tone || 'primary'">
        <span class="w-kpi__icon"><i class="pi" [ngClass]="item.icon || 'pi-chart-bar'"></i></span>
        <div class="w-kpi__body">
          <span class="w-kpi__label">{{ item.label }}</span>
          <span class="w-kpi__value">{{ item.displayValue }}</span>
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
export class KpiGridWidgetComponent implements OnChanges, OnDestroy {
  private readonly cdr = inject(ChangeDetectorRef);
  private frameId = 0;

  @Input({ required: true }) data!: KpiGridData;

  animatedItems: AnimatedKpi[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['data'] || !this.data?.items?.length) {
      this.animatedItems = [];
      return;
    }
    this.animateValues(this.data.items);
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frameId);
  }

  private animateValues(items: KpiItem[]): void {
    cancelAnimationFrame(this.frameId);

    const targets = items.map(item => {
      const numeric = this.parseNumeric(item.value);
      return {
        item,
        numeric,
        prefix: numeric?.prefix ?? '',
        suffix: numeric?.suffix ?? '',
        end: numeric?.value ?? null
      };
    });

    this.animatedItems = targets.map(target => ({
      ...target.item,
      displayValue: target.end == null ? String(target.item.value ?? '—') : `${target.prefix}0${target.suffix}`
    }));
    this.cdr.markForCheck();

    const duration = 520;
    const started = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - started) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);

      this.animatedItems = targets.map(target => {
        if (target.end == null) {
          return { ...target.item, displayValue: String(target.item.value ?? '—') };
        }
        const current = Math.round(target.end * eased);
        return {
          ...target.item,
          displayValue: `${target.prefix}${current.toLocaleString()}${target.suffix}`
        };
      });
      this.cdr.markForCheck();

      if (progress < 1) {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    this.frameId = requestAnimationFrame(tick);
  }

  private parseNumeric(raw: unknown): { value: number; prefix: string; suffix: string } | null {
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      return { value: raw, prefix: '', suffix: '' };
    }
    if (typeof raw !== 'string') {
      return null;
    }
    const trimmed = raw.trim();
    const match = trimmed.match(/^([^0-9-+]*)([-+]?\d[\d,]*(?:\.\d+)?)(.*)$/);
    if (!match) {
      return null;
    }
    const value = Number(match[2].replace(/,/g, ''));
    if (!Number.isFinite(value)) {
      return null;
    }
    return { value, prefix: match[1] ?? '', suffix: match[3] ?? '' };
  }
}
