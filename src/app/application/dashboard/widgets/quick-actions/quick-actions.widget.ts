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
    <div class="staff-actions" role="list">
      <a
        *ngFor="let action of data?.items || []; let i = index"
        class="staff-actions__card"
        role="listitem"
        [style.animation-delay.ms]="i * 45"
        [attr.data-tone]="action.tone || 'primary'"
        [routerLink]="action.route || null"
        [attr.aria-label]="action.label">
        <span class="staff-actions__icon"><i class="pi" [ngClass]="action.icon || 'pi-bolt'" aria-hidden="true"></i></span>
        <span class="staff-actions__label">{{ action.label }}</span>
        <i class="pi pi-chevron-right staff-actions__arrow" aria-hidden="true"></i>
      </a>
    </div>
  `,
  styleUrl: './quick-actions.widget.scss'
})
export class QuickActionsWidgetComponent {
  @Input({ required: true }) data!: QuickActionsData;
}
