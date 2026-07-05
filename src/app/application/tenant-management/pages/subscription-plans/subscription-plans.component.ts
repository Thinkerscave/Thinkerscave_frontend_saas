import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { SubscriptionPlan, Promotion } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import { formatCurrency } from '../../utils/platform-display.util';
import { FEATURE_MATRIX, MatrixGroup } from '../../data/feature-catalog';

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
  promotions: Promotion[] = [];
  activePromoByPlan: Record<number, Promotion> = {};
  recommendedPlanId: number | null = null;
  
  readonly formatCurrency = formatCurrency;
  readonly featureMatrix: MatrixGroup[] = FEATURE_MATRIX;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    forkJoin({
      plans: this.api.getSubscriptionPlans(),
      promotions: this.api.getPromotions()
    }).pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: ({ plans, promotions }) => {
        this.plans = (plans || []).filter(p => p.visible !== false).sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
        this.promotions = promotions || [];
        this.recommendedPlanId = this.plans.find(p => p.recommended)?.id ?? null;
        this.mapPromotions();
      },
      error: () => {
        this.plans = [];
        this.promotions = [];
        this.messageService.add({ severity: 'warn', summary: 'Load failed', detail: 'Could not load subscription data.' });
      }
    });
  }

  private mapPromotions(): void {
    this.activePromoByPlan = {};
    const now = new Date().toISOString();
    const activePromos = this.promotions.filter(p => {
      if (p.status !== 'ACTIVE') {
        return false;
      }
      const from = p.validFrom ?? '';
      const to = p.validTo ?? '9999-12-31T23:59:59';
      return from <= now && to >= now;
    });

    // Current promotion payload has no plan-scoping field; apply first active promo uniformly.
    const selectedPromo = activePromos[0];
    if (!selectedPromo) {
      return;
    }

    for (const plan of this.plans) {
      this.activePromoByPlan[plan.id] = selectedPromo;
    }
  }

  getDiscountedPrice(plan: SubscriptionPlan): number | null {
    const base = this.priceFor(plan);
    if (base == null) return null;
    
    const promo = this.activePromoByPlan[plan.id];
    if (!promo) return null;
    
    if (promo.discountType === 'PERCENTAGE' && promo.discountValue) {
      return base * (1 - promo.discountValue / 100);
    }
    if ((promo.discountType === 'FLAT_AMOUNT' || promo.discountType === 'FLAT') && promo.discountValue) {
      return Math.max(0, base - promo.discountValue);
    }
    return null;
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

  discountedPriceLabel(plan: SubscriptionPlan): string | null {
    const price = this.getDiscountedPrice(plan);
    if (price == null) return null;
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

  toggleActive(plan: SubscriptionPlan): void {
    plan.active = !plan.active;
    this.messageService.add({ severity: 'success', summary: 'Updated', detail: `${plan.planName} is now ${plan.active ? 'active' : 'inactive'}.` });
  }

  editPlan(plan: SubscriptionPlan): void {
    // Placeholder navigation
    this.messageService.add({ severity: 'info', summary: 'Edit Plan', detail: `Opening editor for ${plan.planName}...` });
  }

  trackByPlan(_: number, plan: SubscriptionPlan): number { return plan.id; }
}
