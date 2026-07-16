import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TransportSummaryData } from '../../models/dashboard.model';

@Component({
  selector: 'tc-transport-summary-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-summary-highlight">
      <span>{{ data.routeName || 'Route' }}</span>
      <strong class="w-tag" data-tone="success" *ngIf="data.liveStatus">{{ data.liveStatus }}</strong>
    </div>
    <div class="w-summary-rows">
      <div class="w-summary-row" *ngIf="data.vehicleNumber">
        <span><i class="pi pi-car"></i> Vehicle</span>
        <strong>{{ data.vehicleNumber }}</strong>
      </div>
      <div class="w-summary-row" *ngIf="data.pickupTime">
        <span><i class="pi pi-arrow-up"></i> Pickup</span>
        <strong>{{ data.pickupTime }}</strong>
      </div>
      <div class="w-summary-row" *ngIf="data.dropTime">
        <span><i class="pi pi-arrow-down"></i> Drop</span>
        <strong>{{ data.dropTime }}</strong>
      </div>
    </div>
  `
})
export class TransportSummaryWidgetComponent {
  @Input({ required: true }) data!: TransportSummaryData;
}
