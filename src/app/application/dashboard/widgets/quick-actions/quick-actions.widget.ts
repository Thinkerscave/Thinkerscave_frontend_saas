import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { QuickActionsData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-quick-actions-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-actions w-actions--bar" role="list">
      <a
        *ngFor="let action of data?.items || []; let i = index"
        class="w-actions__btn"
        role="listitem"
        [style.animation-delay.ms]="i * 45"
        [routerLink]="action.route || null">
        <span class="w-actions__icon"><i class="pi" [ngClass]="action.icon || 'pi-bolt'"></i></span>
        <span class="w-actions__label">{{ action.label }}</span>
      </a>
    </div>
  `
})
export class QuickActionsWidgetComponent {
  @Input({ required: true }) data!: QuickActionsData;
}
