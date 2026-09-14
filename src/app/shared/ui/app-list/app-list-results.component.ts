import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Soft refresh overlay for list/table regions.
 * Keeps existing content visible; never blanks the page.
 */
@Component({
  selector: 'app-list-results',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-list-results" [class.is-busy]="busy" [attr.aria-busy]="busy">
      <div class="app-list-results__overlay" *ngIf="busy" role="status" aria-live="polite">
        <span class="app-list-results__bar" aria-hidden="true"></span>
        <span class="app-list-results__label" *ngIf="busyLabel">{{ busyLabel }}</span>
      </div>
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './app-list-results.component.scss'
})
export class AppListResultsComponent {
  @Input() busy = false;
  /** Optional; leave empty — skeleton/soft dim is enough without “Updating…” copy. */
  @Input() busyLabel = '';
}
