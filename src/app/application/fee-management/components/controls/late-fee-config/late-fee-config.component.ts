import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputSwitchModule } from 'primeng/inputswitch';
import { DividerModule } from 'primeng/divider';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

interface LateFeeConfig {
  calculationMethod: string;
  fixedAmount: number;
  percentageRate: number;
  gracePeriodDays: number;
  maxLateFee: number;
  hasMaxCap: boolean;
  applyAfterGrace: boolean;
  compoundFrequency: string;
  applyToFeeHeads: string[];
  excludeWeekends: boolean;
  excludeHolidays: boolean;
  isActive: boolean;
}

@Component({
  selector: 'app-late-fee-config',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ButtonModule, CardModule, InputNumberModule, DropdownModule, MultiSelectModule, InputSwitchModule, DividerModule, ToastModule, TagModule],
  providers: [MessageService],
  template: `
    <div class="late-fee-config">
      <p-toast></p-toast>

      <div class="page-header">
        <div>
          <h2><i class="pi pi-clock"></i> Late Fee Configuration</h2>
          <p>Configure how late fees are calculated and applied</p>
        </div>
        <div class="header-actions">
          <button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../"></button>
          <p-tag [value]="config.isActive ? 'ACTIVE' : 'INACTIVE'" [severity]="config.isActive ? 'success' : 'warn'"></p-tag>
        </div>
      </div>

      <div class="config-container">
        <!-- Main Settings Card -->
        <div class="config-card">
          <div class="card-header">
            <h3><i class="pi pi-calculator"></i> Calculation Method</h3>
            <p-inputSwitch [(ngModel)]="config.isActive" (onChange)="onStatusChange()"></p-inputSwitch>
          </div>

          <div class="form-section">
            <div class="form-field">
              <label>Calculation Method</label>
              <p-dropdown [options]="calculationMethods" [(ngModel)]="config.calculationMethod" optionLabel="label" optionValue="value" [style]="{'width':'100%'}"></p-dropdown>
            </div>

            <div class="form-grid" *ngIf="config.calculationMethod === 'FIXED'">
              <div class="form-field">
                <label>Fixed Amount per Day</label>
                <p-inputNumber [(ngModel)]="config.fixedAmount" [min]="0" prefix="₹" suffix=" /day"></p-inputNumber>
              </div>
            </div>

            <div class="form-grid" *ngIf="config.calculationMethod === 'PERCENTAGE'">
              <div class="form-field">
                <label>Percentage Rate</label>
                <p-inputNumber [(ngModel)]="config.percentageRate" [min]="0" [max]="100" suffix="% /month"></p-inputNumber>
              </div>
              <div class="form-field">
                <label>Compound Frequency</label>
                <p-dropdown [options]="compoundOptions" [(ngModel)]="config.compoundFrequency" optionLabel="label" optionValue="value" [style]="{'width':'100%'}"></p-dropdown>
              </div>
            </div>

            <div class="form-grid" *ngIf="config.calculationMethod === 'SLAB'">
              <div class="slab-info">
                <p><strong>Slab-based Calculation</strong></p>
                <ul>
                  <li>1-15 days: ₹50/day</li>
                  <li>16-30 days: ₹75/day</li>
                  <li>31-60 days: ₹100/day</li>
                  <li>61+ days: ₹150/day</li>
                </ul>
                <button pButton label="Edit Slabs" icon="pi pi-pencil" class="p-button-text p-button-sm"></button>
              </div>
            </div>
          </div>

          <p-divider></p-divider>

          <div class="form-section">
            <h4>Grace Period & Caps</h4>
            <div class="form-grid">
              <div class="form-field">
                <label>Grace Period (Days)</label>
                <p-inputNumber [(ngModel)]="config.gracePeriodDays" [min]="0" [max]="30" suffix=" days"></p-inputNumber>
                <small>No late fee charged during this period</small>
              </div>
              <div class="form-field">
                <div class="cap-field">
                  <div class="cap-toggle">
                    <p-inputSwitch [(ngModel)]="config.hasMaxCap"></p-inputSwitch>
                    <label>Maximum Late Fee Cap</label>
                  </div>
                  <p-inputNumber *ngIf="config.hasMaxCap" [(ngModel)]="config.maxLateFee" [min]="0" prefix="₹"></p-inputNumber>
                </div>
              </div>
            </div>
          </div>

          <p-divider></p-divider>

          <div class="form-section">
            <h4>Application Settings</h4>
            <div class="form-field">
              <label>Apply to Fee Heads</label>
              <p-multiSelect [options]="feeHeadOptions" [(ngModel)]="config.applyToFeeHeads" placeholder="Select fee heads" optionLabel="label" optionValue="value" [style]="{'width':'100%'}"></p-multiSelect>
            </div>

            <div class="toggle-options">
              <div class="toggle-option">
                <p-inputSwitch [(ngModel)]="config.applyAfterGrace"></p-inputSwitch>
                <div class="toggle-label">
                  <label>Apply cumulative after grace</label>
                  <small>Calculate late fee for all days including grace period after it ends</small>
                </div>
              </div>
              <div class="toggle-option">
                <p-inputSwitch [(ngModel)]="config.excludeWeekends"></p-inputSwitch>
                <div class="toggle-label">
                  <label>Exclude weekends</label>
                  <small>Don't count Saturdays and Sundays</small>
                </div>
              </div>
              <div class="toggle-option">
                <p-inputSwitch [(ngModel)]="config.excludeHolidays"></p-inputSwitch>
                <div class="toggle-label">
                  <label>Exclude holidays</label>
                  <small>Don't count school holidays</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview Card -->
        <div class="preview-card">
          <h3><i class="pi pi-eye"></i> Live Preview</h3>
          <p class="preview-desc">Example calculation for ₹10,000 overdue</p>

          <div class="preview-table">
            <div class="preview-row header">
              <span>Days Overdue</span>
              <span>Late Fee</span>
            </div>
            <div class="preview-row" *ngFor="let preview of getPreviewCalculations()">
              <span>{{ preview.days }} days</span>
              <span class="amount">₹{{ preview.fee | number }}</span>
            </div>
          </div>

          <div class="preview-example">
            <div class="example-header">Example Scenario</div>
            <p>If a student owes ₹10,000 and is <strong>{{ exampleDays }} days</strong> overdue:</p>
            <div class="example-result">
              <span>Late Fee</span>
              <span class="amount">₹{{ calculateLateFee(10000, exampleDays) | number }}</span>
            </div>
            <div class="example-slider">
              <input type="range" [(ngModel)]="exampleDays" [min]="1" [max]="90" />
              <span>{{ exampleDays }} days</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="form-actions">
        <button pButton label="Reset to Default" icon="pi pi-refresh" class="p-button-outlined" (click)="resetConfig()"></button>
        <button pButton label="Save Configuration" icon="pi pi-check" (click)="saveConfig()" [loading]="saving"></button>
      </div>
    </div>
  `,
  styles: [`
    .late-fee-config { padding: 1.5rem; max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; }
    .page-header h2 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }
    .page-header p { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
    .header-actions { display: flex; align-items: center; gap: 1rem; }

    .config-container { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
    .config-card, .preview-card { background: var(--surface-card); border-radius: 12px; padding: 1.5rem; }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .card-header h3 { margin: 0; display: flex; align-items: center; gap: 0.5rem; }

    .form-section { margin-bottom: 1rem; }
    .form-section h4 { margin: 0 0 1rem; color: var(--text-color-secondary); font-size: 0.875rem; text-transform: uppercase; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
    .form-field { display: flex; flex-direction: column; gap: 0.5rem; }
    .form-field label { font-weight: 500; font-size: 0.875rem; }
    .form-field small { color: var(--text-color-secondary); font-size: 0.75rem; }

    .slab-info { background: var(--surface-ground); padding: 1rem; border-radius: 8px; }
    .slab-info p { margin: 0 0 0.5rem; }
    .slab-info ul { margin: 0; padding-left: 1.5rem; }
    .slab-info li { margin: 0.25rem 0; color: var(--text-color-secondary); }

    .cap-field { display: flex; flex-direction: column; gap: 0.75rem; }
    .cap-toggle { display: flex; align-items: center; gap: 0.75rem; }

    .toggle-options { display: flex; flex-direction: column; gap: 1rem; margin-top: 1rem; }
    .toggle-option { display: flex; align-items: flex-start; gap: 1rem; padding: 1rem; background: var(--surface-ground); border-radius: 8px; }
    .toggle-label { display: flex; flex-direction: column; }
    .toggle-label label { font-weight: 500; }
    .toggle-label small { color: var(--text-color-secondary); }

    .preview-card h3 { margin: 0 0 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
    .preview-desc { color: var(--text-color-secondary); margin: 0 0 1.5rem; font-size: 0.875rem; }

    .preview-table { border: 1px solid var(--surface-border); border-radius: 8px; overflow: hidden; margin-bottom: 1.5rem; }
    .preview-row { display: flex; justify-content: space-between; padding: 0.75rem 1rem; }
    .preview-row.header { background: var(--surface-ground); font-weight: 500; font-size: 0.875rem; }
    .preview-row:not(.header) { border-top: 1px solid var(--surface-border); }
    .preview-row .amount { font-weight: 600; color: #ef4444; }

    .preview-example { background: var(--surface-ground); padding: 1rem; border-radius: 8px; }
    .example-header { font-weight: 600; margin-bottom: 0.5rem; }
    .preview-example p { margin: 0 0 1rem; font-size: 0.875rem; }
    .example-result { display: flex; justify-content: space-between; padding: 0.75rem; background: var(--surface-card); border-radius: 6px; margin-bottom: 1rem; }
    .example-result .amount { font-size: 1.25rem; font-weight: 700; color: #ef4444; }
    .example-slider { display: flex; align-items: center; gap: 1rem; }
    .example-slider input { flex: 1; }

    .form-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; padding: 1.5rem; background: var(--surface-card); border-radius: 12px; }

    @media (max-width: 768px) { .config-container { grid-template-columns: 1fr; } .form-grid { grid-template-columns: 1fr; } }
  `]
})
export class LateFeeConfigComponent implements OnInit {
  saving = false;
  exampleDays = 30;

  config: LateFeeConfig = {
    calculationMethod: 'FIXED',
    fixedAmount: 50,
    percentageRate: 2,
    gracePeriodDays: 7,
    maxLateFee: 5000,
    hasMaxCap: true,
    applyAfterGrace: false,
    compoundFrequency: 'MONTHLY',
    applyToFeeHeads: ['Tuition'],
    excludeWeekends: false,
    excludeHolidays: false,
    isActive: true
  };

  calculationMethods = [
    { label: 'Fixed Amount per Day', value: 'FIXED' },
    { label: 'Percentage of Outstanding', value: 'PERCENTAGE' },
    { label: 'Slab-based', value: 'SLAB' }
  ];

  compoundOptions = [
    { label: 'Simple (No Compound)', value: 'NONE' },
    { label: 'Monthly', value: 'MONTHLY' },
    { label: 'Weekly', value: 'WEEKLY' }
  ];

  feeHeadOptions = [
    { label: 'Tuition Fee', value: 'Tuition' },
    { label: 'Transport Fee', value: 'Transport' },
    { label: 'Lab Fee', value: 'Lab' },
    { label: 'All Fees', value: 'All' }
  ];

  constructor(private messageService: MessageService) { }

  ngOnInit(): void { }

  getPreviewCalculations(): { days: number, fee: number }[] {
    return [
      { days: 7, fee: this.calculateLateFee(10000, 7) },
      { days: 15, fee: this.calculateLateFee(10000, 15) },
      { days: 30, fee: this.calculateLateFee(10000, 30) },
      { days: 60, fee: this.calculateLateFee(10000, 60) }
    ];
  }

  calculateLateFee(amount: number, days: number): number {
    if (days <= this.config.gracePeriodDays && !this.config.applyAfterGrace) return 0;

    const effectiveDays = this.config.applyAfterGrace ? days : Math.max(0, days - this.config.gracePeriodDays);
    let fee = 0;

    if (this.config.calculationMethod === 'FIXED') {
      fee = effectiveDays * this.config.fixedAmount;
    } else if (this.config.calculationMethod === 'PERCENTAGE') {
      fee = Math.round((amount * this.config.percentageRate / 100) * (effectiveDays / 30));
    } else if (this.config.calculationMethod === 'SLAB') {
      if (effectiveDays <= 15) fee = effectiveDays * 50;
      else if (effectiveDays <= 30) fee = 15 * 50 + (effectiveDays - 15) * 75;
      else if (effectiveDays <= 60) fee = 15 * 50 + 15 * 75 + (effectiveDays - 30) * 100;
      else fee = 15 * 50 + 15 * 75 + 30 * 100 + (effectiveDays - 60) * 150;
    }

    if (this.config.hasMaxCap && fee > this.config.maxLateFee) {
      fee = this.config.maxLateFee;
    }

    return Math.round(fee);
  }

  onStatusChange(): void {
    this.messageService.add({
      severity: this.config.isActive ? 'success' : 'warn',
      summary: this.config.isActive ? 'Late Fee Enabled' : 'Late Fee Disabled',
      detail: this.config.isActive ? 'Late fees will be calculated for overdue payments' : 'No late fees will be applied',
      life: 3000
    });
  }

  resetConfig(): void {
    this.config = {
      calculationMethod: 'FIXED',
      fixedAmount: 50,
      percentageRate: 2,
      gracePeriodDays: 7,
      maxLateFee: 5000,
      hasMaxCap: true,
      applyAfterGrace: false,
      compoundFrequency: 'MONTHLY',
      applyToFeeHeads: ['Tuition'],
      excludeWeekends: false,
      excludeHolidays: false,
      isActive: true
    };
    this.messageService.add({ severity: 'info', summary: 'Reset', detail: 'Configuration reset to defaults', life: 3000 });
  }

  saveConfig(): void {
    this.saving = true;
    setTimeout(() => {
      this.saving = false;
      this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Late fee configuration saved successfully', life: 3000 });
    }, 1000);
  }
}
