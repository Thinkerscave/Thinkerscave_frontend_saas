import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { finalize } from 'rxjs';

import { CounselorOption } from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';

@Component({
  selector: 'app-counselor-picker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DialogModule],
  template: `
    <p-dialog
      [header]="title"
      [visible]="open"
      [modal]="true"
      [draggable]="false"
      [style]="{ width: 'min(480px, 94vw)' }"
      (visibleChange)="onVisibleChange($event)">
      <p class="adm-small-muted">Search staff by name, designation, or email.</p>
      <div class="tc-form-field">
        <label>Search counselor</label>
        <input
          type="search"
          [(ngModel)]="keyword"
          placeholder="Search counselor..."
          (ngModelChange)="search()"
        />
      </div>
      @if (loading()) {
        <div class="tc-loading"><i class="pi pi-spin pi-spinner"></i> Loading staff...</div>
      } @else if (!staff().length) {
        <div class="tc-empty-state adm-empty-compact">
          <p>No matching staff found.</p>
        </div>
      } @else {
        <div class="adm-counselor-list">
          @for (person of staff(); track person.staffId) {
            <button type="button" class="adm-counselor-row" (click)="select(person)">
              <strong>{{ person.fullName }}</strong>
              <small>{{ person.designation || person.staffType || 'Staff' }}{{ person.email ? ' · ' + person.email : '' }}</small>
            </button>
          }
        </div>
      }
      <ng-template pTemplate="footer">
        <button type="button" class="tc-btn" (click)="cancel.emit()">Cancel</button>
      </ng-template>
    </p-dialog>
  `,
  styles: [`
    .adm-counselor-list { display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow: auto; }
    .adm-counselor-row {
      display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
      padding: 10px 12px; border: 1px solid var(--tc-border); border-radius: 10px;
      background: var(--tc-surface-0); cursor: pointer; text-align: left; width: 100%;
    }
    .adm-counselor-row:hover { border-color: var(--tc-primary-500); }
    .adm-counselor-row small { color: var(--tc-text-muted); }
    .adm-small-muted { color: var(--tc-text-muted); font-size: 0.82rem; margin: 0 0 10px; }
    .tc-form-field { display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px; }
    .tc-form-field label { font-size: 0.74rem; font-weight: 700; color: var(--tc-text-muted); text-transform: uppercase; }
    .tc-form-field input {
      width: 100%; min-height: 40px; border: 1px solid var(--tc-border); border-radius: 10px;
      padding: 8px 12px; font: inherit;
    }
  `]
})
export class CounselorPickerComponent implements OnChanges {
  private readonly api = inject(AdmissionsCrmService);

  @Input() open = false;
  @Input() title = 'Assign counselor';
  @Output() selected = new EventEmitter<CounselorOption>();
  @Output() cancel = new EventEmitter<void>();

  keyword = '';
  readonly loading = signal(false);
  readonly staff = signal<CounselorOption[]>([]);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue) {
      this.keyword = '';
      this.search();
    }
  }

  onVisibleChange(visible: boolean): void {
    if (!visible) this.cancel.emit();
  }

  search(): void {
    this.loading.set(true);
    this.api.searchCounselors(this.keyword, 0, 50)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: page => this.staff.set(page.content ?? []),
        error: () => this.staff.set([])
      });
  }

  select(person: CounselorOption): void {
    this.selected.emit(person);
  }
}
