import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CommunicationService, Notice } from '../../services/communication.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasFilterRowComponent,
  SaasPillComponent,
  SaasStatGridComponent,
  SaasStat
} from '../../../../shared/ui/saas';

type PriorityFilter = 'all' | 'High' | 'Medium' | 'Low';
type StatusFilter = 'all' | 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

@Component({
  selector: 'app-announcements-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink, SaasPageHeaderComponent, SaasPanelComponent, SaasFilterRowComponent, SaasPillComponent, SaasStatGridComponent],
  templateUrl: './announcements-list.component.html',
  styleUrl: './announcements-list.component.scss'
})
export class AnnouncementsListComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly api = inject(CommunicationService);
  private readonly router = inject(Router);

  loading = true;
  notices: Notice[] = [];
  search = '';
  audienceFilter = 'all';
  priorityFilter: PriorityFilter = 'all';
  statusFilter: StatusFilter = 'all';

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.listNotices()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: list => { this.notices = list || []; this.loading = false; this.cdr.markForCheck(); },
        error: () => { this.notices = []; this.loading = false; this.cdr.markForCheck(); }
      });
  }

  get stats(): SaasStat[] {
    const total = this.notices.length;
    const scheduled = this.notices.filter(n => n.status === 'DRAFT').length;
    const today = new Date().toISOString().slice(0, 10);
    const sentToday = this.notices.filter(n => n.publishedAt?.startsWith(today)).length;
    const high = this.notices.filter(n => (n as any).priority === 'High').length;
    return [
      { key: 'total', label: 'Total Announcements', value: total.toString(), helper: 'All-time', icon: 'pi pi-megaphone', tone: 'primary' },
      { key: 'scheduled', label: 'Scheduled', value: scheduled.toString(), helper: 'Awaiting send', icon: 'pi pi-clock', tone: 'info' },
      { key: 'sentToday', label: 'Sent Today', value: sentToday.toString(), helper: 'Today\'s deliveries', icon: 'pi pi-send', tone: 'success' },
      { key: 'high', label: 'High Priority', value: high.toString(), helper: 'Urgent items', icon: 'pi pi-flag-fill', tone: 'danger' }
    ];
  }

  get audiences(): string[] { return Array.from(new Set(this.notices.map(n => n.audience).filter(Boolean))).sort(); }

  get filtered(): Notice[] {
    const q = this.search.trim().toLowerCase();
    return this.notices.filter(n => {
      if (this.audienceFilter !== 'all' && n.audience !== this.audienceFilter) return false;
      if (this.priorityFilter !== 'all' && (n as any).priority !== this.priorityFilter) return false;
      if (this.statusFilter !== 'all' && n.status !== this.statusFilter) return false;
      if (q && !n.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  statusTone(s: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (s === 'PUBLISHED') return 'success';
    if (s === 'DRAFT') return 'warning';
    if (s === 'ARCHIVED') return 'neutral';
    return 'info';
  }

  priorityTone(p: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    if (p === 'High') return 'danger';
    if (p === 'Medium') return 'warning';
    if (p === 'Low') return 'info';
    return 'neutral';
  }

  trackById(_: number, n: Notice): number { return n.id; }
}
