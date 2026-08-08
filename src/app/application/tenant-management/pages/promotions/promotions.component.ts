import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { finalize } from 'rxjs';

import { DiscountType, Promotion } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  discountTypeLabel,
  formatDate,
  formatDiscountValue,
  promotionStatusLabel,
  promotionTone
} from '../../utils/platform-display.util';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';
import { AppGridTableToggleComponent, AppListViewMode } from '../../../../shared/ui/app-list';

interface PromotionDraft {
  promotionCode: string;
  promotionName: string;
  discountType: DiscountType;
  discountValue: number | null;
  validFrom: string;
  validTo: string;
}

@Component({
  selector: 'app-promotions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    ToastModule,
    DropdownModule,
    SaasPageHeaderComponent,
    SaasStatGridComponent,
    SaasPanelComponent,
    SaasPillComponent,
    CalendarModule,
    AppGridTableToggleComponent
  ],
  providers: [MessageService],
  templateUrl: './promotions.component.html',
  styleUrl: './promotions.component.scss'
})
export class PromotionsComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);

  loading = true;
  saving = false;
  archivingId: number | null = null;
  errorMessage = '';
  promotions: Promotion[] = [];
  createOpen = false;
  viewMode: AppListViewMode = 'grid';
  draft: PromotionDraft = this.emptyDraft();

  readonly discountTypes: DiscountType[] = ['PERCENTAGE', 'FLAT_AMOUNT'];
  readonly discountTypeOptions: { label: string; value: DiscountType }[] = this.discountTypes.map(t => ({
    label: discountTypeLabel(t),
    value: t
  }));

  readonly formatDate = formatDate;
  readonly discountTypeLabel = discountTypeLabel;
  readonly promotionStatusLabel = promotionStatusLabel;
  readonly promotionTone = promotionTone;
  readonly formatDiscountValue = formatDiscountValue;

  ngOnInit(): void {
    this.load();
  }

  get stats(): SaasStat[] {
    const list = this.promotions;
    const active = list.filter(p => p.status === 'ACTIVE').length;
    const expired = list.filter(p => p.status === 'EXPIRED').length;
    const totalUsed = list.reduce((sum, p) => sum + (p.usedCount ?? 0), 0);
    return [
      { key: 'total', label: 'Total Promotions', value: list.length, helper: 'All commercial offers', icon: 'pi pi-percentage', tone: 'primary' },
      { key: 'active', label: 'Active', value: active, helper: 'Currently redeemable', icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'expired', label: 'Expired', value: expired, helper: 'Past validity window', icon: 'pi pi-clock', tone: 'warning' },
      { key: 'used', label: 'Total Redemptions', value: totalUsed, helper: 'Across all promotions', icon: 'pi pi-shopping-cart', tone: 'info' }
    ];
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getPromotions()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: list => this.promotions = list ?? [],
        error: () => {
          this.promotions = [];
          this.errorMessage = 'Unable to load promotions. Verify backend access and try again.';
        }
      });
  }

  openCreate(): void {
    this.draft = this.emptyDraft();
    this.createOpen = true;
  }

  closeCreate(): void {
    this.createOpen = false;
  }

  submitCreate(): void {
    if (!this.draft.promotionCode.trim() || !this.draft.promotionName.trim()) {
      this.messages.add({ severity: 'warn', summary: 'Missing fields', detail: 'Promotion code and name are required.' });
      return;
    }

    this.saving = true;
    this.api.createPromotion({
      promotionCode: this.draft.promotionCode.trim().toUpperCase(),
      promotionName: this.draft.promotionName.trim(),
      discountType: this.draft.discountType,
      discountValue: this.draft.discountValue ?? undefined,
      validFrom: this.draft.validFrom || undefined,
      validTo: this.draft.validTo || undefined
    })
      .pipe(
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Promotion created', detail: 'The new promotion is now available.' });
          this.createOpen = false;
          this.load();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Create failed', detail: 'Could not create promotion. Check values and permissions.' })
      });
  }

  archive(promotion: Promotion, event: Event): void {
    event.stopPropagation();
    if (promotion.status === 'ARCHIVED') return;
    
    if (!window.confirm(`Are you sure you want to archive promotion ${promotion.promotionCode}?`)) {
      return;
    }

    this.archivingId = promotion.id;
    this.api.archivePromotion(promotion.id)
      .pipe(
        finalize(() => {
          this.archivingId = null;
          this.cdr.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          this.messages.add({ severity: 'success', summary: 'Promotion archived', detail: `${promotion.promotionCode} has been archived.` });
          this.load();
        },
        error: () => this.messages.add({ severity: 'error', summary: 'Archive failed', detail: 'Could not archive this promotion.' })
      });
  }

  trackById(_: number, item: Promotion): number {
    return item.id;
  }

  private emptyDraft(): PromotionDraft {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return {
      promotionCode: '',
      promotionName: '',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      validFrom: today.toISOString().slice(0, 10),
      validTo: nextMonth.toISOString().slice(0, 10)
    };
  }
}
