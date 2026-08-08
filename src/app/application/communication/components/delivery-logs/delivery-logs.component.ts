import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DropdownModule } from 'primeng/dropdown';

import { CommunicationService, Notification } from '../../services/communication.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasFilterRowComponent,
  SaasPillComponent,
  SaasStatGridComponent,
  SaasStat
} from '../../../../shared/ui/saas';

interface SelectOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-delivery-logs',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DatePipe, DropdownModule, SaasPageHeaderComponent, SaasPanelComponent, SaasFilterRowComponent, SaasPillComponent, SaasStatGridComponent],
  templateUrl: './delivery-logs.component.html',
  styleUrl: './delivery-logs.component.scss'
})
export class DeliveryLogsComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly api = inject(CommunicationService);

  loading = true;
  notifications: Notification[] = [];
  search = '';
  channelFilter = 'all';
  statusFilter = 'all';
  fromDate = this.daysAgo(7);
  toDate = this.today();

  readonly channelOptions: SelectOption[] = [
    { label: 'All', value: 'all' },
    { label: 'Email', value: 'EMAIL' },
    { label: 'SMS', value: 'SMS' },
    { label: 'Push', value: 'PUSH' },
    { label: 'In-app', value: 'IN_APP' }
  ];

  readonly statusOptions: SelectOption[] = [
    { label: 'All', value: 'all' },
    { label: 'Delivered', value: 'SENT' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Failed', value: 'FAILED' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.listNotifications()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => { this.notifications = list || []; this.loading = false; this.cdr.markForCheck(); },
        error: () => { this.notifications = []; this.loading = false; this.cdr.markForCheck(); }
      });
  }

  get stats(): SaasStat[] {
    const total = this.notifications.length;
    const delivered = this.notifications.filter(n => n.status === 'SENT').length;
    const failed = this.notifications.filter(n => n.status === 'FAILED').length;
    const pending = this.notifications.filter(n => n.status === 'PENDING').length;
    const pct = (n: number) => total ? ((n / total) * 100).toFixed(1) + '%' : '0%';
    return [
      { key: 'total', label: 'Total Sent', value: total.toLocaleString(), helper: 'Last 7 days', icon: 'pi pi-send', tone: 'primary' },
      { key: 'delivered', label: 'Delivered', value: delivered.toLocaleString(), helper: pct(delivered), icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'failed', label: 'Failed', value: failed.toLocaleString(), helper: pct(failed), icon: 'pi pi-times-circle', tone: 'danger' },
      { key: 'pending', label: 'Pending', value: pending.toLocaleString(), helper: pct(pending), icon: 'pi pi-clock', tone: 'warning' }
    ];
  }

  get filtered(): Notification[] {
    const q = this.search.trim().toLowerCase();
    return this.notifications.filter(n => {
      if (this.channelFilter !== 'all' && n.channel !== this.channelFilter) return false;
      if (this.statusFilter !== 'all' && n.status !== this.statusFilter) return false;
      if (q && !(n.subject || '').toLowerCase().includes(q)) return false;
      return true;
    });
  }

  statusTone(s: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (s === 'SENT') return 'success';
    if (s === 'PENDING') return 'warning';
    if (s === 'FAILED') return 'danger';
    return 'neutral';
  }

  exportCsv(): void {
    const rows = [['ID', 'Type', 'Recipient', 'Channel', 'Sent', 'Status']];
    this.filtered.forEach(n => rows.push([
      String(n.id),
      n.subject || '',
      String(n.totalRecipients ?? ''),
      n.channel,
      n.sentAt || '',
      n.status
    ]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = window.URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `delivery-logs-${this.today()}.csv`; a.click();
    window.URL.revokeObjectURL(url);
  }

  private today(): string { return new Date().toISOString().slice(0, 10); }
  private daysAgo(n: number): string { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }
}
