import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';

import { AdminControlDataService } from '../../../administration/services/admin-control-data.service';
import { SubscriptionPlanDTO } from '../../../administration/models/admin-control.model';

import {
  SaasPageHeaderComponent,
  SaasStepperComponent,
  SaasPillComponent
} from '../../../../shared/ui/saas';

interface PlanCardView {
  raw: SubscriptionPlanDTO;
  popular: boolean;
  features: string[];
  modules: string[];
  highlightTone: 'primary' | 'info' | 'purple' | 'neutral' | 'warning';
}

@Component({
  selector: 'app-subscription-plans',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ToastModule, SaasPageHeaderComponent, SaasStepperComponent, SaasPillComponent],
  providers: [MessageService],
  templateUrl: './subscription-plans.component.html',
  styleUrl: './subscription-plans.component.scss'
})
export class SubscriptionPlansComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly adminData = inject(AdminControlDataService);
  private readonly messageService = inject(MessageService);

  loading = true;
  saving = false;
  billing: 'monthly' | 'annual' = 'monthly';
  plans: PlanCardView[] = [];

  wizardOpen = false;
  step = 0;
  readonly wizardSteps = [
    { key: 'basic', label: 'Basic Information' },
    { key: 'limits', label: 'Limits' },
    { key: 'modules', label: 'Modules' },
    { key: 'review', label: 'Review' }
  ];

  draft: SubscriptionPlanDTO = this.emptyDraft();
  moduleOptions = ['Academics', 'Attendance', 'Examinations', 'Fee Management', 'Communication', 'Library', 'Transport', 'Hostel', 'Reports', 'Mobile App', 'API Access'];
  selectedModules = new Set<string>();

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.adminData.listSubscriptionPlans()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => this.plans = (list || []).map(p => this.toView(p)).sort((a, b) => (a.raw.monthlyPrice || 0) - (b.raw.monthlyPrice || 0)),
        error: () => this.plans = []
      });
  }

  priceFor(plan: PlanCardView): number {
    const p = plan.raw;
    return this.billing === 'annual' ? (p.annualPrice ?? (p.monthlyPrice ?? 0) * 10) : (p.monthlyPrice ?? 0);
  }
  priceLabel(plan: PlanCardView): string {
    if (!plan.raw.monthlyPrice && !plan.raw.annualPrice) return 'Custom';
    const symbol = plan.raw.currency === 'USD' ? '$' : '₹';
    return `${symbol}${this.priceFor(plan).toLocaleString()}`;
  }

  toneClass(plan: PlanCardView): string { return `plan-card--${plan.highlightTone}`; }

  openWizard(): void {
    this.draft = this.emptyDraft();
    this.selectedModules = new Set();
    this.step = 0;
    this.wizardOpen = true;
  }
  closeWizard(): void { this.wizardOpen = false; }

  next(): void { if (this.step < this.wizardSteps.length - 1) this.step += 1; }
  prev(): void { if (this.step > 0) this.step -= 1; }

  toggleModule(name: string): void {
    if (this.selectedModules.has(name)) this.selectedModules.delete(name);
    else this.selectedModules.add(name);
  }

  submitPlan(): void {
    this.saving = true;
    this.draft.modulesIncluded = Array.from(this.selectedModules).join(',');
    this.draft.planCode = (this.draft.planName || '').toUpperCase().replace(/\s+/g, '_');
    this.adminData.createSubscriptionPlan(this.draft)
      .pipe(finalize(() => { this.saving = false; this.cdr.markForCheck(); }), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.messageService.add({ severity: 'success', summary: 'Plan Created', detail: 'The new subscription plan is now available for assignment.' });
          this.wizardOpen = false;
          this.load();
        },
        error: () => this.messageService.add({ severity: 'error', summary: 'Could not create plan', detail: 'Verify limits and retry. SUPER_ADMIN role is required.' })
      });
  }

  trackByPlan(_: number, plan: PlanCardView): string | number { return plan.raw.planId ?? plan.raw.planCode; }

  private emptyDraft(): SubscriptionPlanDTO {
    return {
      planCode: '', planName: '', description: '',
      monthlyPrice: 0, annualPrice: 0, currency: 'INR',
      maxStudents: 1000, maxStaff: 100, maxUsers: 250, storageGb: 50,
      modulesIncluded: '', supportTier: 'Standard', highlightColor: '#2C5BFF',
      featured: false, active: true
    };
  }

  private toView(p: SubscriptionPlanDTO): PlanCardView {
    const code = (p.planCode || '').toLowerCase();
    const popular = !!p.featured || code.includes('pro');
    const features: string[] = [];
    if (p.maxStudents) features.push(`Up to ${p.maxStudents.toLocaleString()} students`);
    if (p.maxStaff) features.push(`Up to ${p.maxStaff.toLocaleString()} staff`);
    if (p.maxUsers) features.push(`Up to ${p.maxUsers.toLocaleString()} users`);
    if (p.storageGb) features.push(`${p.storageGb} GB storage`);
    if (p.supportTier) features.push(`${p.supportTier} support`);
    const modules = (p.modulesIncluded || '').split(',').map(m => m.trim()).filter(Boolean);
    const tone = code.includes('enter') ? 'purple' : popular ? 'primary' : code.includes('custom') ? 'warning' : code.includes('start') ? 'info' : 'neutral';
    return { raw: p, popular, features, modules, highlightTone: tone };
  }
}
