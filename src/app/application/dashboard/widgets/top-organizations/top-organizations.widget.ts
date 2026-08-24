import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TopOrganizationsData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-top-organizations-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-list">
      <div class="w-list__row" *ngFor="let org of data?.items || []; let i = index">
        <span class="w-list__icon">{{ i + 1 }}</span>
        <div class="w-list__main">
          <p class="w-list__title">{{ org.organizationName }}</p>
          <p class="w-list__meta">
            <span *ngIf="org.institutionType">{{ org.institutionType }}</span>
            <span *ngIf="org.planName">{{ org.planName }}</span>
          </p>
        </div>
        <span class="w-list__trail">{{ org.activeUsers | number }} users</span>
      </div>
    </div>
  `
})
export class TopOrganizationsWidgetComponent {
  @Input({ required: true }) data!: TopOrganizationsData;
}
