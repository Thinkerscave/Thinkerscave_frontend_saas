import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AdminControlCenter } from '../../../administration/models/admin-control.model';
import { AdminControlDataService } from '../../../administration/services/admin-control-data.service';
import { FEATURE_MATRIX, MatrixGroup, MatrixRow, MatrixTier, PLAN_DEFS, PlanDefinition } from '../../data/feature-catalog';

@Component({
  selector: 'app-subscription-plans',
  standalone: true,
  imports: [CommonModule, RouterLink, ToastModule],
  providers: [MessageService],
  templateUrl: './subscription-plans.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubscriptionPlansComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly adminData = inject(AdminControlDataService);
  private readonly messageService = inject(MessageService);

  loading = true;
  workspace: AdminControlCenter | null = null;

  readonly plans: PlanDefinition[] = PLAN_DEFS;
  readonly tierIds: MatrixTier[] = ['starter', 'professional', 'enterprise', 'custom'];
  matrix: MatrixGroup[] = FEATURE_MATRIX;
  openGroups = new Set<string>();

  ngOnInit(): void {
    // Default: first two groups expanded for a faster scan.
    FEATURE_MATRIX.slice(0, 2).forEach(g => this.openGroups.add(g.title));
    this.adminData.loadWorkspace()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ws => {
          this.workspace = ws;
          const supplementary = this.buildSupplementaryRows(ws);
          if (supplementary.length) {
            this.matrix = [
              ...FEATURE_MATRIX,
              { title: 'Module access', caption: 'Modules surfaced through your tenant configuration', icon: 'pi-th-large', rows: supplementary }
            ];
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: () => { this.loading = false; this.cdr.markForCheck(); }
      });
  }

  private buildSupplementaryRows(ws: AdminControlCenter | null): MatrixRow[] {
    const sections = ws?.menuSections || [];
    const seen = new Set(FEATURE_MATRIX.flatMap(g => g.rows.map(r => r.label.toLowerCase())));
    return sections
      .filter(s => !seen.has(s.name.toLowerCase()))
      .slice(0, 8)
      .map(s => ({
        label: s.name,
        values: {
          starter: { value: false },
          professional: { value: true },
          enterprise: { value: true },
          custom: { value: 'Configurable' }
        }
      } as MatrixRow));
  }

  cellIsBoolean(value: string | boolean): value is boolean {
    return typeof value === 'boolean';
  }

  toggleGroup(title: string): void {
    if (this.openGroups.has(title)) this.openGroups.delete(title);
    else this.openGroups.add(title);
  }

  expandAll(): void {
    this.matrix.forEach(g => this.openGroups.add(g.title));
  }

  collapseAll(): void {
    this.openGroups.clear();
  }

  comingSoonNewPlan(): void {
    this.messageService.add({
      severity: 'info',
      summary: 'Coming soon',
      detail: 'Defining brand-new plans from the UI lands in an upcoming release. For now, plans are managed in code and the Custom tier covers bespoke quotas.',
      life: 5000
    });
  }
}
