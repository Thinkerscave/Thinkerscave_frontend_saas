import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AccordionModule } from 'primeng/accordion';
import { HeroVisualComponent } from '../components/hero-visual/hero-visual.component';
import { MarketingNavbarComponent } from '../components/marketing-navbar/marketing-navbar.component';
import { MarketingFooterComponent } from '../components/marketing-footer/marketing-footer.component';
import { OrganizationContextService } from '../../core/services/organization-context.service';
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
  PRODUCT_CAROUSEL
} from '../data/marketing-content';

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
export class LandingComponent {
  private readonly orgContext = inject(OrganizationContextService);

  readonly metrics = TRUST_METRICS;
  readonly logos = INSTITUTION_LOGOS;
  readonly modules = PLATFORM_MODULES;
  readonly benefits = BENEFITS;
  readonly capabilities = CAPABILITIES;
  readonly integrations = INTEGRATIONS;
  readonly testimonials = TESTIMONIALS;
  readonly plans = PRICING_PLANS;
  readonly faqs = FAQ_ITEMS;
  readonly carousel = PRODUCT_CAROUSEL;

  readonly yearlyBilling = signal(false);
  readonly activeSlide = signal(0);

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

  priceForPlan(plan: (typeof PRICING_PLANS)[0]): string {
    if (plan.enterprise) {
      return 'Custom';
    }
    const amount = this.yearlyBilling() ? plan.yearlyPrice : plan.monthlyPrice;
    return `₹${amount.toLocaleString('en-IN')}`;
  }

  nextSlide(): void {
    this.activeSlide.update(i => (i + 1) % this.carousel.length);
  }

  prevSlide(): void {
    this.activeSlide.update(i => (i - 1 + this.carousel.length) % this.carousel.length);
  }
}
