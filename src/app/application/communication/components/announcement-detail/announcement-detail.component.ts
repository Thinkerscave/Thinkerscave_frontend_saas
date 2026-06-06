import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CommunicationService, Notice } from '../../services/communication.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent
} from '../../../../shared/ui/saas';

interface DeliverySegment { key: string; label: string; value: number; color: string; }

@Component({
  selector: 'app-announcement-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DatePipe, RouterLink, SaasPageHeaderComponent, SaasPanelComponent, SaasPillComponent],
  templateUrl: './announcement-detail.component.html',
  styleUrl: './announcement-detail.component.scss'
})
export class AnnouncementDetailComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly api = inject(CommunicationService);
  private readonly route = inject(ActivatedRoute);

  loading = true;
  notice: Notice | null = null;

  delivery = { total: 1842, delivered: 1759, pending: 51, failed: 32 };

  get segments(): DeliverySegment[] {
    return [
      { key: 'delivered', label: 'Delivered', value: this.delivery.delivered, color: 'var(--saas-success)' },
      { key: 'pending', label: 'Pending', value: this.delivery.pending, color: 'var(--saas-warning)' },
      { key: 'failed', label: 'Failed', value: this.delivery.failed, color: 'var(--saas-danger)' }
    ];
  }

  get donutGradient(): string {
    let acc = 0;
    const total = this.segments.reduce((s, x) => s + x.value, 0) || 1;
    return this.segments.map(seg => {
      const start = (acc / total) * 100;
      acc += seg.value;
      const end = (acc / total) * 100;
      return `${seg.color} ${start}% ${end}%`;
    }).join(', ');
  }

  get deliveryRate(): string { return ((this.delivery.delivered / Math.max(1, this.delivery.total)) * 100).toFixed(1); }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.listNotices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => {
          this.notice = list?.find(n => n.id === id) || null;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => { this.loading = false; this.cdr.markForCheck(); }
      });
  }
}
