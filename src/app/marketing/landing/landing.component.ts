import { Component, ChangeDetectionStrategy, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { catchError, of } from 'rxjs';
import { HeroVisualComponent } from '../components/hero-visual/hero-visual.component';
import { MarketingNavbarComponent } from '../components/marketing-navbar/marketing-navbar.component';
import { MarketingFooterComponent } from '../components/marketing-footer/marketing-footer.component';
import { OrganizationContextService } from '../../core/services/organization-context.service';
import { publicSubscriptionPlansApi } from '../../shared/constants/api.endpoint';
import { unwrapApiList, unwrapApiResponse } from '../../shared/utils/api-response.util';
import {
  TRUST_METRICS,
  INSTITUTION_LOGOS,
  PLATFORM_MODULES,
  BENEFITS,
  CAPABILITIES,
  INTEGRATIONS,
  TESTIMONIALS,
  PRICING_PLANS,
  FAQ_ITEMS,
  PRODUCT_CAROUSEL,
  MarketingPricingPlan
} from '../data/marketing-content';

interface PublicSubscriptionPlanDto {
  id?: number;
  planCode?: string;
  planName?: string;
  description?: string;
  monthlyPrice?: number | string;
  yearlyPrice?: number | string;
  studentLimit?: number;
  staffLimit?: number;
  branchLimit?: number;
  storageLimitGb?: number;
  recommended?: boolean;
  customPlan?: boolean;
  features?: Array<{ featureName?: string; enabled?: boolean; active?: boolean }>;
}

@Component({
  selector: 'tc-landing',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    AccordionModule,
    MarketingNavbarComponent,
    MarketingFooterComponent,
    HeroVisualComponent
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
  private readonly orgContext = inject(OrganizationContextService);
  private readonly http = inject(HttpClient);

  readonly metrics = TRUST_METRICS;
  readonly logos = INSTITUTION_LOGOS;
  readonly modules = PLATFORM_MODULES;
  readonly benefits = BENEFITS;
  readonly capabilities = CAPABILITIES;
  readonly integrations = INTEGRATIONS;
  readonly testimonials = TESTIMONIALS;
  readonly plans = signal<MarketingPricingPlan[]>(PRICING_PLANS);
  readonly faqs = FAQ_ITEMS;
  readonly carousel = PRODUCT_CAROUSEL;

  readonly yearlyBilling = signal(false);
  readonly activeSlide = signal(0);

  ngOnInit(): void {
    this.http.get<unknown>(publicSubscriptionPlansApi.list).pipe(
      catchError(() => of(null))
    ).subscribe(response => {
      if (!response) {
        return;
      }
      const apiPlans = unwrapApiResponse<PublicSubscriptionPlanDto[]>(
        response,
        unwrapApiList<PublicSubscriptionPlanDto>(response)
      );
      const mapped = (apiPlans ?? [])
        .map(plan => this.mapPublicPlan(plan))
        .filter((plan): plan is MarketingPricingPlan => !!plan);
      if (mapped.length) {
        this.plans.set(mapped);
      }
    });
  }

  loginRoute(): string[] {
    return this.orgContext.requiresSelection
      ? ['/auth/select-organization']
      : ['/auth/login'];
  }

  toggleBilling(): void {
    this.yearlyBilling.update(v => !v);
  }

  setSlide(index: number): void {
    this.activeSlide.set(index);
  }

  priceForPlan(plan: MarketingPricingPlan): string {
    if (plan.enterprise) {
      return 'Custom';
    }
    const amount = this.yearlyBilling() ? plan.yearlyPrice : plan.monthlyPrice;
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  }

  nextSlide(): void {
    this.activeSlide.update(i => (i + 1) % this.carousel.length);
  }

  prevSlide(): void {
    this.activeSlide.update(i => (i - 1 + this.carousel.length) % this.carousel.length);
  }

  private mapPublicPlan(plan: PublicSubscriptionPlanDto): MarketingPricingPlan | null {
    const name = (plan.planName || '').trim();
    if (!name) {
      return null;
    }
    const monthly = this.toNumber(plan.monthlyPrice);
    const yearlyTotal = this.toNumber(plan.yearlyPrice);
    // Landing yearly toggle shows billed-yearly total (same unit as admin yearlyPrice).
    const yearlyDisplay = yearlyTotal > 0 ? yearlyTotal : Math.round(monthly * 12 * 0.8);
    const featureNames = (plan.features ?? [])
      .filter(f => f.enabled !== false && f.active !== false)
      .map(f => f.featureName?.trim())
      .filter((f): f is string => !!f);
    const limits: string[] = [];
    if (plan.studentLimit != null && plan.studentLimit > 0) {
      limits.push(`Up to ${plan.studentLimit.toLocaleString('en-IN')} students`);
    }
    if (plan.staffLimit != null && plan.staffLimit > 0) {
      limits.push(`Up to ${plan.staffLimit.toLocaleString('en-IN')} staff`);
    }
    if (plan.branchLimit != null && plan.branchLimit > 0) {
      limits.push(`${plan.branchLimit} branch${plan.branchLimit === 1 ? '' : 'es'}`);
    }
    if (plan.storageLimitGb != null && plan.storageLimitGb > 0) {
      limits.push(`${plan.storageLimitGb} GB storage`);
    }

    return {
      id: plan.planCode || String(plan.id ?? name.toLowerCase()),
      name,
      monthlyPrice: monthly,
      yearlyPrice: yearlyDisplay,
      description: plan.description?.trim() || `ThinkersCave ${name} plan.`,
      features: featureNames.length ? featureNames : limits,
      popular: Boolean(plan.recommended),
      enterprise: Boolean(plan.customPlan) || monthly <= 0
    };
  }

  private toNumber(value: number | string | null | undefined): number {
    if (value == null || value === '') {
      return 0;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
}
