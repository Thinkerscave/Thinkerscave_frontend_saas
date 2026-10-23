import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';

import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { UiConfirmService } from '../../../../core/feedback/ui-confirm.service';
import { ListContextService } from '../../../../core/services/list-context.service';
import { UI_PAGINATION } from '../../../../shared/config/ui-standards';
import { AppEmptyStateComponent } from '../../../../shared/ui/app-form/app-empty-state.component';
import { AppListResultsComponent } from '../../../../shared/ui/app-list/app-list-results.component';
import { AppListToolbarComponent } from '../../../../shared/ui/app-list/app-list-toolbar.component';
import { AppPaginatorComponent } from '../../../../shared/ui/app-list/app-paginator.component';
import { AppPageChangeEvent } from '../../../../shared/utils/paged-result.util';
import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas/saas-primitives';
import { TcPageSkeletonComponent } from '../../../../shared/ui/loading/tc-page-skeleton.component';
import { FrontDeskApiService } from '../../front-desk-api.service';

@Component({
  selector: 'app-active-visitors',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink, SaasPageHeaderComponent, SaasPanelComponent, AppListToolbarComponent, AppListResultsComponent, AppPaginatorComponent, AppEmptyStateComponent, TcPageSkeletonComponent, AppToastComponent],
  providers: [MessageService],
  templateUrl: './active-visitors.component.html',
  styleUrls: ['../../front-desk.shared.scss']
})
export class ActiveVisitorsComponent implements OnInit {
  private readonly api = inject(FrontDeskApiService);
  private readonly lists = inject(ListContextService);
  private readonly messages = inject(MessageService);
  private readonly dialogs = inject(UiConfirmService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly key = 'front-desk-active-visitors';

  keyword = '';
  page = 0;
  size = UI_PAGINATION.defaultSize;
  total = 0;
  rows: Record<string, unknown>[] = [];
  firstLoad = true;
  busy = false;

  ngOnInit(): void {
    const saved = this.lists.peek(this.key);
    if (saved) {
      this.page = saved.page ?? 0;
      this.size = saved.size ?? this.size;
      this.keyword = saved.search ?? '';
    }
    this.reload(this.page);
  }

  reload(page: number): void {
    this.page = page;
    this.busy = true;
    this.lists.save(this.key, { page, size: this.size, search: this.keyword });
    this.api.list('visitors', page, this.size, this.keyword, { activeOnly: true }).subscribe({
      next: result => {
        this.rows = result.content ?? [];
        this.total = result.totalElements ?? 0;
        this.busy = false;
        this.firstLoad = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.busy = false;
        this.firstLoad = false;
        this.messages.add({ severity: 'error', summary: 'Visitors could not be loaded' });
        this.cdr.markForCheck();
      }
    });
  }

  reset(): void {
    this.keyword = '';
    this.reload(0);
  }

  onPage(event: AppPageChangeEvent): void {
    this.size = event.rows;
    this.reload(event.page);
  }

  asDate(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
  }

  async checkOut(row: Record<string, unknown>): Promise<void> {
    const ok = await this.dialogs.confirm({
      header: 'Check out visitor?',
      message: `Record the out-time for ${row['visitorName'] ?? 'this visitor'} and close the campus visit.`,
      acceptLabel: 'Check out'
    });
    if (!ok) return;
    this.api.postAction(`visitors/${row['id']}/check-out`).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Visitor checked out' });
        this.reload(this.page);
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Check-out failed' })
    });
  }
}
