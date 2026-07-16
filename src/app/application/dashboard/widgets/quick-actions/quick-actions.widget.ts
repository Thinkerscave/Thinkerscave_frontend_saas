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
    <div class="w-actions">
      <a *ngFor="let action of data.items" class="w-actions__btn" [routerLink]="action.route || null">
        <i class="pi" [ngClass]="action.icon || 'pi-bolt'"></i>
        {{ action.label }}
      </a>
    </div>
  `
})
export class QuickActionsWidgetComponent {
  @Input({ required: true }) data!: QuickActionsData;
}
