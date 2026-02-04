import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
@Component({
    selector: 'app-receipt-view',
    standalone: true,
    imports: [CommonModule, RouterModule, CardModule, ButtonModule],
    template: `
    <div class="component-container">
      <div class="page-header"><h2><i class="pi pi-receipt"></i> View Receipt</h2><button pButton label="Back" icon="pi pi-arrow-left" class="p-button-text" routerLink="../../"></button></div>
      <div class="form-card"><p class="placeholder-text"><i class="pi pi-info-circle"></i> Receipt View - Printable receipt with download option</p></div>
    </div>
  `,
    styles: [`.component-container{padding:1.5rem}.page-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem}.page-header h2{margin:0;display:flex;align-items:center;gap:.5rem}.form-card{background:var(--surface-card);border-radius:12px;padding:2rem}.placeholder-text{color:var(--text-color-secondary);display:flex;align-items:center;gap:.5rem;padding:2rem;background:var(--surface-ground);border-radius:8px}`]
})
export class ReceiptViewComponent { }
