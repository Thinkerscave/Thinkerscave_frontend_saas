import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ProfileSummaryData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-profile-summary-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-profile">
      <span class="w-avatar">
        <img *ngIf="data.avatarUrl" [src]="data.avatarUrl" [alt]="data.displayName" />
        <ng-container *ngIf="!data.avatarUrl">{{ initials() }}</ng-container>
      </span>
      <div class="w-profile__body">
        <h4>{{ data.displayName }}</h4>
        <p>{{ data.roleLabel }}<ng-container *ngIf="data.organizationName"> · {{ data.organizationName }}</ng-container></p>
      </div>
    </div>
    <div class="w-summary-rows" style="margin-top: 14px;">
      <div class="w-summary-row" *ngIf="data.email">
        <span><i class="pi pi-envelope"></i> Email</span>
        <strong>{{ data.email }}</strong>
      </div>
      <div class="w-summary-row" *ngIf="data.mobileNumber">
        <span><i class="pi pi-phone"></i> Mobile</span>
        <strong>{{ data.mobileNumber }}</strong>
      </div>
    </div>
  `
})
export class ProfileSummaryWidgetComponent {
  @Input({ required: true }) data!: ProfileSummaryData;

  initials(): string {
    return (this.data.displayName || '?')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('');
  }
}
