import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PendingTasksData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-pending-tasks-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-list">
      <div class="w-list__row" *ngFor="let item of data?.items || []">
        <span class="w-list__icon"><i [class]="item.completed ? 'pi pi-check-circle' : 'pi pi-clock'"></i></span>
        <div class="w-list__main">
          <p class="w-list__title">
            {{ item.title }}
            <i class="pi pi-eye" *ngIf="item.sample" title="Preview data" style="font-size: .7rem; color: var(--saas-text-soft);"></i>
          </p>
          <p class="w-list__meta" *ngIf="item.dueLabel">Due {{ item.dueLabel }}</p>
        </div>
        <span class="w-tag" [attr.data-tone]="item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'neutral'" *ngIf="item.priority">
          {{ item.priority }}
        </span>
      </div>
    </div>
  `
})
export class PendingTasksWidgetComponent {
  @Input({ required: true }) data!: PendingTasksData;
}
