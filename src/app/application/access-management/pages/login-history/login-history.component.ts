import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { LoginHistoryEntry, LoginStatus } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import { formatDateTime, loginStatusLabel, loginStatusTone } from '../../utils/access-display.util';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-login-history',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, DatePipe, SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent, SaasPillComponent],
  templateUrl: './login-history.component.html',
  styleUrl: './login-history.component.scss'
})
export class LoginHistoryComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  errorMessage = '';
  statusFilter: 'all' | LoginStatus = 'all';
  entries: LoginHistoryEntry[] = [];
  totalRecords = 0;

  readonly loginStatusLabel = loginStatusLabel;
  readonly loginStatusTone = loginStatusTone;
  readonly formatDateTime = formatDateTime;

  ngOnInit(): void { this.load(); }

  get stats(): SaasStat[] {
    const success = this.entries.filter(e => e.status === 'SUCCESS').length;
    const failed = this.entries.filter(e => e.status === 'FAILED').length;
    return [
      { key: 'total', label: 'Events (page)', value: this.entries.length, icon: 'pi pi-history', tone: 'primary' },
      { key: 'success', label: 'Successful', value: success, icon: 'pi pi-check', tone: 'success' },
      { key: 'failed', label: 'Failed', value: failed, icon: 'pi pi-times', tone: 'danger' },
      { key: 'all', label: 'Total records', value: this.totalRecords, icon: 'pi pi-database', tone: 'neutral' }
    ];
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getOrgLoginHistory(
      this.api.organizationId(),
      this.statusFilter === 'all' ? undefined : this.statusFilter,
      0,
      100
    ).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        this.entries = page.content ?? [];
        this.totalRecords = page.totalElements ?? 0;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.entries = [];
        this.errorMessage = 'Could not load login history.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onFilterChange(): void { this.load(); }
  trackById(_: number, e: LoginHistoryEntry): number { return e.id; }
}
