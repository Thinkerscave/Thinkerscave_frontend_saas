import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';

import {
  DocumentVaultCategory,
  DocumentVaultEntry,
  DocumentVaultKpi
} from '../../models/students-workspace.model';
import { StudentsWorkspaceService } from '../../services/students-workspace.service';

interface KpiTile {
  key: keyof DocumentVaultKpi;
  label: string;
  hint: string;
  tone: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
}

@Component({
  selector: 'app-document-vault',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule],
  styleUrls: ['../../../admissions/admissions.shared.scss', '../../students.shared.scss'],
  templateUrl: './document-vault.component.html'
})
export class DocumentVaultComponent implements OnInit {
  private readonly api = inject(StudentsWorkspaceService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMessage = '';

  kpi: DocumentVaultKpi = { totalDocuments: 0, verifiedDocuments: 0, pendingVerification: 0, missingDocuments: 0 };
  entries: DocumentVaultEntry[] = [];

  readonly kpiTiles: KpiTile[] = [
    { key: 'totalDocuments',      label: 'Total Documents', hint: 'All categories',       tone: 'info' },
    { key: 'verifiedDocuments',   label: 'Verified',        hint: 'Marked as approved',   tone: 'success' },
    { key: 'pendingVerification', label: 'Pending Review',  hint: 'Awaiting verification', tone: 'warning' },
    { key: 'missingDocuments',    label: 'Missing',          hint: 'Required but not uploaded', tone: 'danger' }
  ];

  readonly categories: ('ALL' | DocumentVaultCategory)[] = ['ALL', 'PERSONAL', 'ACADEMIC', 'MEDICAL', 'OTHER'];
  activeCategory: 'ALL' | DocumentVaultCategory = 'ALL';

  ngOnInit(): void { this.loadAll(); }

  loadAll(): void {
    this.loading = true;
    forkJoin({
      kpi: this.api.documentKpi(),
      docs: this.api.documents(this.activeCategory === 'ALL' ? undefined : this.activeCategory)
    })
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: ({ kpi, docs }) => { this.kpi = kpi; this.entries = docs; },
        error: () => { this.errorMessage = 'Could not load documents.'; }
      });
  }

  filterCategory(c: 'ALL' | DocumentVaultCategory): void {
    this.activeCategory = c;
    this.loading = true;
    this.api.documents(c === 'ALL' ? undefined : c)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: docs => { this.entries = docs; },
        error: () => { this.errorMessage = 'Could not filter documents.'; }
      });
  }

  statusTone(s: string): string {
    return s === 'VERIFIED' ? 'success'
         : s === 'PENDING'  ? 'warning'
         : s === 'MISSING'  ? 'danger'
         : 'neutral';
  }
}
