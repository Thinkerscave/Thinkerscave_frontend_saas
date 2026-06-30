import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { SubscriptionPlan } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import { formatCurrency } from '../../utils/platform-display.util';

import {
  SaasPageHeaderComponent,
  SaasPillComponent,
  SaasPanelComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-subscription-plans',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ToastModule, SaasPageHeaderComponent, SaasPillComponent, SaasPanelComponent],
  providers: [MessageService],
  templateUrl: './subscription-plans.component.html',
  styleUrl: './subscription-plans.component.scss'
})
export class SubscriptionPlansComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly api = inject(PlatformManagementService);
  private readonly messageService = inject(MessageService);

  loading = true;
  billing: 'monthly' | 'yearly' = 'monthly';
  plans: SubscriptionPlan[] = [];
  readonly formatCurrency = formatCurrency;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.getSubscriptionPlans()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => this.plans = (list || []).filter(p => p.visible !== false).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0)),
        error: () => {
          this.plans = [];
          this.messageService.add({ severity: 'warn', summary: 'Load failed', detail: 'Could not load subscription plans from platform API.' });
        }
      });
  }

  priceFor(plan: SubscriptionPlan): number | null {
    if (this.billing === 'yearly') return plan.yearlyPrice ?? (plan.monthlyPrice != null ? plan.monthlyPrice * 10 : null);
    return plan.monthlyPrice ?? null;
  }

  priceLabel(plan: SubscriptionPlan): string {
    const price = this.priceFor(plan);
    if (price == null) return 'Custom';
    return formatCurrency(Number(price));
  }

  limits(plan: SubscriptionPlan): string[] {
    const out: string[] = [];
    if (plan.studentLimit) out.push(`${plan.studentLimit.toLocaleString()} students`);
    if (plan.staffLimit) out.push(`${plan.staffLimit.toLocaleString()} staff`);
    if (plan.branchLimit) out.push(`${plan.branchLimit} branches`);
    if (plan.storageLimitGb) out.push(`${plan.storageLimitGb} GB storage`);
    return out;
  }

  trackByPlan(_: number, plan: SubscriptionPlan): number { return plan.id; }
}
