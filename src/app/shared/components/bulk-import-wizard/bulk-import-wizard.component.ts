import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { StepsModule } from 'primeng/steps';
import { TableModule } from 'primeng/table';
import { MessageModule } from 'primeng/message';
import { ProgressBarModule } from 'primeng/progressbar';
import { MenuItem, MessageService } from 'primeng/api';
import {
  BulkImportConfig,
  BulkImportExecutionResult,
  BulkImportRowError
} from './bulk-import-wizard.models';

/**
 * Reusable 4-step bulk import wizard:
 *   1. Upload   — drop or pick a CSV/XLSX file, optional template download
 *   2. Preview  — show parsed rows in a table
 *   3. Validate — show errors, allow proceeding with valid rows only
 *   4. Import   — submit and show summary (imported/skipped/failed)
 *
 * Page-level concerns (parsing, validating, persisting) live in the
 * {@link BulkImportConfig} supplied via `[config]`.
 */
@Component({
  selector: 'app-bulk-import-wizard',
  standalone: true,
  imports: [
    CommonModule, ButtonModule, StepsModule, TableModule,
    MessageModule, ProgressBarModule
  ],
  templateUrl: './bulk-import-wizard.component.html',
  styleUrls: ['./bulk-import-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BulkImportWizardComponent<TRow = any> {
  @Input({ required: true }) config!: BulkImportConfig<TRow>;
  @Input() title = 'Bulk import';
  @Input() description: string | null = 'Upload a file, preview the rows and confirm the import.';

  @Output() completed = new EventEmitter<BulkImportExecutionResult>();
  @Output() cancelled = new EventEmitter<void>();

  readonly steps: MenuItem[] = [
    { label: 'Upload' },
    { label: 'Preview' },
    { label: 'Validate' },
    { label: 'Import' }
  ];

  activeStep = signal(0);
  file = signal<File | null>(null);
  parsedRows = signal<TRow[]>([]);
  validRows = signal<TRow[]>([]);
  errors = signal<BulkImportRowError[]>([]);
  busy = signal(false);
  result = signal<BulkImportExecutionResult | null>(null);

  constructor(private readonly messageService: MessageService) {}

  // ----- step 1 -----------------------------------------------------------
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const picked = input.files?.[0] ?? null;
    if (!picked) return;
    const maxBytes = this.config.maxFileSizeBytes ?? 5 * 1024 * 1024;
    if (picked.size > maxBytes) {
      this.messageService.add({ severity: 'warn', summary: 'File too large',
        detail: `Maximum allowed size is ${(maxBytes / 1024 / 1024).toFixed(1)} MB` });
      return;
    }
    this.file.set(picked);
  }

  async parse(): Promise<void> {
    const f = this.file();
    if (!f) return;
    this.busy.set(true);
    try {
      const rows = await this.config.parseFile(f);
      this.parsedRows.set(rows);
      this.activeStep.set(1);
    } catch (err: any) {
      this.messageService.add({ severity: 'error', summary: 'Parse failed', detail: err?.message ?? String(err) });
    } finally {
      this.busy.set(false);
    }
  }

  // ----- step 2 → 3 -------------------------------------------------------
  async validate(): Promise<void> {
    this.busy.set(true);
    try {
      const res = await this.config.validate(this.parsedRows());
      this.validRows.set(res.validRows);
      this.errors.set(res.errors);
      this.activeStep.set(2);
    } finally {
      this.busy.set(false);
    }
  }

  // ----- step 3 → 4 -------------------------------------------------------
  async submit(): Promise<void> {
    if (!this.validRows().length) return;
    this.busy.set(true);
    try {
      const res = await this.config.execute(this.validRows());
      this.result.set(res);
      this.activeStep.set(3);
      this.completed.emit(res);
    } catch (err: any) {
      this.messageService.add({ severity: 'error', summary: 'Import failed', detail: err?.message ?? String(err) });
    } finally {
      this.busy.set(false);
    }
  }

  reset(): void {
    this.activeStep.set(0);
    this.file.set(null);
    this.parsedRows.set([]);
    this.validRows.set([]);
    this.errors.set([]);
    this.result.set(null);
  }

  cancel(): void {
    this.reset();
    this.cancelled.emit();
  }
}
