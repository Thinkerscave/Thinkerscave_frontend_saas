import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { AppAvatarComponent } from './app-avatar.component';
import { AppStatusBadgeComponent } from './app-status-badge.component';

export interface AppCustomerCardData {
  id: number;
  customerName: string;
  customerCode?: string;
  domain?: string;
  logoUrl?: string | null;
  status?: string;
  ownerName?: string;
  ownerEmail?: string;
  organizationCount?: number;
  createdDate?: string;
  lastActivity?: string;
}

@Component({
  selector: 'app-customer-card',
  standalone: true,
  imports: [CommonModule, AppAvatarComponent, AppStatusBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="app-customer-card"
      role="button"
      tabindex="0"
      (click)="cardClick.emit()"
      (keydown.enter)="cardClick.emit()"
      (keydown.space)="$event.preventDefault(); cardClick.emit()">
      <header class="app-customer-card__header">
        <app-avatar [name]="customer.customerName" [logoUrl]="customer.logoUrl ?? null" size="lg"></app-avatar>
        <div class="app-customer-card__identity">
          <strong class="app-customer-card__name">{{ customer.customerName }}</strong>
          <span class="app-customer-card__meta">
            <span *ngIf="customer.domain">{{ customer.domain }}</span>
            <span *ngIf="customer.domain && customer.customerCode"> · </span>
            <span *ngIf="customer.customerCode">{{ customer.customerCode }}</span>
          </span>
        </div>
        <app-status-badge [status]="customer.status || ''"></app-status-badge>
      </header>

      <div class="app-customer-card__owner" *ngIf="customer.ownerName || customer.ownerEmail">
        <i class="pi pi-user" aria-hidden="true"></i>
        <div>
          <span *ngIf="customer.ownerName">{{ customer.ownerName }}</span>
          <small *ngIf="customer.ownerEmail">{{ customer.ownerEmail }}</small>
        </div>
      </div>

      <footer class="app-customer-card__footer">
        <span class="app-customer-card__stat">
          <i class="pi pi-building" aria-hidden="true"></i>
          {{ customer.organizationCount ?? 0 }} org{{ (customer.organizationCount ?? 0) === 1 ? '' : 's' }}
        </span>
        <span class="app-customer-card__stat" *ngIf="customer.createdDate">
          <i class="pi pi-calendar" aria-hidden="true"></i>
          {{ customer.createdDate }}
        </span>
        <span class="app-customer-card__stat" *ngIf="customer.lastActivity">
          <i class="pi pi-clock" aria-hidden="true"></i>
          {{ customer.lastActivity }}
        </span>
      </footer>
    </article>
  `,
  styleUrl: './app-customer-card.component.scss'
})
export class AppCustomerCardComponent {
  @Input({ required: true }) customer!: AppCustomerCardData;
  @Output() cardClick = new EventEmitter<void>();
}
