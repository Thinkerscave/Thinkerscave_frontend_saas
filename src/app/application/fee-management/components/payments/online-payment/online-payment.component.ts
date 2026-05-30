import { Component , ChangeDetectionStrategy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
@Component({
    selector: 'app-online-payment',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule],
    template: `
    <div class="component-container">
      <div class="page-header"><div><h2><i class="pi pi-globe"></i> Online Payment</h2><p>Make online fee payment</p></div></div>
      <div class="form-card"><p class="placeholder-text"><i class="pi pi-info-circle"></i> Online Payment - Gateway integration for parent/guardian payments</p></div>
    </div>
  `,
    styles: [`.component-container{padding:1.5rem}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem}.page-header h2{margin:0;display:flex;align-items:center;gap:.5rem}.page-header p{margin:.25rem 0 0;color:var(--text-color-secondary)}.form-card{background:var(--surface-card);border-radius:12px;padding:2rem}.placeholder-text{color:var(--text-color-secondary);display:flex;align-items:center;gap:.5rem;padding:2rem;background:var(--surface-ground);border-radius:8px}`]
})
export class OnlinePaymentComponent { }
