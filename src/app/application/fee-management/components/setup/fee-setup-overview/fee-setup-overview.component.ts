import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { StepsModule } from 'primeng/steps';
import { TagModule } from 'primeng/tag';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-fee-setup-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    StepsModule,
    TagModule
  ],
  template: `
    <div class="fee-setup-overview">
      <div class="page-header">
        <h1><i class="pi pi-cog"></i> Fee Setup & Configuration</h1>
        <p class="subtitle">Configure fee policies, heads, groups, and structures for your institution</p>
      </div>

      <!-- Setup Steps Indicator -->
      <div class="setup-steps-container">
        <p-steps [model]="setupSteps" [activeIndex]="currentStep" [readonly]="false"></p-steps>
      </div>

      <!-- Setup Cards -->
      <div class="setup-grid">
        <!-- Fee Policy -->
        <div class="setup-card" [class.completed]="completedSteps.includes(0)">
          <div class="card-header">
            <div class="step-indicator">1</div>
            <p-tag *ngIf="completedSteps.includes(0)" value="Completed" severity="success"></p-tag>
            <p-tag *ngIf="!completedSteps.includes(0)" value="Pending" severity="warn"></p-tag>
          </div>
          <div class="card-icon">
            <i class="pi pi-file-edit"></i>
          </div>
          <h3>Fee Policy</h3>
          <p>Define fee policies for the academic session including late fees, installment rules, and refund policies.</p>
          <div class="card-actions">
            <a routerLink="../policy" pButton label="Configure Policy" icon="pi pi-arrow-right" class="p-button-outlined"></a>
          </div>
        </div>

        <!-- Fee Heads -->
        <div class="setup-card" [class.completed]="completedSteps.includes(1)">
          <div class="card-header">
            <div class="step-indicator">2</div>
            <p-tag *ngIf="completedSteps.includes(1)" value="Completed" severity="success"></p-tag>
            <p-tag *ngIf="!completedSteps.includes(1)" value="Pending" severity="warn"></p-tag>
          </div>
          <div class="card-icon">
            <i class="pi pi-list"></i>
          </div>
          <h3>Fee Heads</h3>
          <p>Create fee head masters like Tuition, Lab Fee, Library, Transport, etc. with their default amounts.</p>
          <div class="card-actions">
            <a routerLink="../heads" pButton label="Manage Heads" icon="pi pi-arrow-right" class="p-button-outlined"></a>
          </div>
        </div>

        <!-- Fee Groups -->
        <div class="setup-card" [class.completed]="completedSteps.includes(2)">
          <div class="card-header">
            <div class="step-indicator">3</div>
            <p-tag *ngIf="completedSteps.includes(2)" value="Completed" severity="success"></p-tag>
            <p-tag *ngIf="!completedSteps.includes(2)" value="Pending" severity="warn"></p-tag>
          </div>
          <div class="card-icon">
            <i class="pi pi-th-large"></i>
          </div>
          <h3>Fee Groups</h3>
          <p>Bundle multiple fee heads into groups like "Regular Admission Package" or "Day Scholar Package".</p>
          <div class="card-actions">
            <a routerLink="../groups" pButton label="Manage Groups" icon="pi pi-arrow-right" class="p-button-outlined"></a>
          </div>
        </div>

        <!-- Fee Structure -->
        <div class="setup-card" [class.completed]="completedSteps.includes(3)">
          <div class="card-header">
            <div class="step-indicator">4</div>
            <p-tag *ngIf="completedSteps.includes(3)" value="Completed" severity="success"></p-tag>
            <p-tag *ngIf="!completedSteps.includes(3)" value="Pending" severity="warn"></p-tag>
          </div>
          <div class="card-icon">
            <i class="pi pi-sitemap"></i>
          </div>
          <h3>Fee Structure</h3>
          <p>Map fee groups to classes/programs with specific amounts, due dates, and installment plans.</p>
          <div class="card-actions">
            <a routerLink="../structure" pButton label="Define Structure" icon="pi pi-arrow-right" class="p-button-outlined"></a>
          </div>
        </div>
      </div>

      <!-- Warning Notice -->
      <div class="warning-notice">
        <i class="pi pi-exclamation-triangle"></i>
        <div class="notice-content">
          <strong>Configuration Lock Notice</strong>
          <p>Once fee structures are used to generate student contracts, they become <strong>read-only</strong>. 
             Any modifications will require creating a new version. Please verify all configurations carefully before generating contracts.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .fee-setup-overview {
      padding: 1.5rem;
      background: var(--surface-ground);
      min-height: calc(100vh - 120px);
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      margin: 0;
      font-size: 1.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .page-header h1 i {
      color: var(--primary-color);
    }

    .subtitle {
      margin: 0.5rem 0 0;
      color: var(--text-color-secondary);
    }

    .setup-steps-container {
      background: var(--surface-card);
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .setup-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .setup-card {
      background: var(--surface-card);
      border-radius: 12px;
      padding: 1.5rem;
      border: 2px solid var(--surface-border);
      transition: all 0.3s;
    }

    .setup-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      border-color: var(--primary-color);
    }

    .setup-card.completed {
      border-color: #10b981;
      background: linear-gradient(135deg, var(--surface-card) 0%, #f0fdf4 100%);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .step-indicator {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
    }

    .card-icon {
      width: 64px;
      height: 64px;
      border-radius: 16px;
      background: var(--primary-100);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .card-icon i {
      font-size: 1.75rem;
      color: var(--primary-color);
    }

    .setup-card h3 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
    }

    .setup-card p {
      color: var(--text-color-secondary);
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .card-actions {
      border-top: 1px solid var(--surface-border);
      padding-top: 1rem;
    }

    .warning-notice {
      display: flex;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: #fef3c7;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }

    .warning-notice i {
      color: #f59e0b;
      font-size: 1.25rem;
      margin-top: 0.25rem;
    }

    .notice-content strong {
      color: #92400e;
    }

    .notice-content p {
      margin: 0.25rem 0 0;
      color: #b45309;
      font-size: 0.875rem;
    }
  `]
})
export class FeeSetupOverviewComponent {
  currentStep = 0;
  completedSteps: number[] = [];

  setupSteps: MenuItem[] = [
    { label: 'Fee Policy' },
    { label: 'Fee Heads' },
    { label: 'Fee Groups' },
    { label: 'Fee Structure' }
  ];
}
