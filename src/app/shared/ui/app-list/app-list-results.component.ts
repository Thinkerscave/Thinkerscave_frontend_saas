import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Overlay loader for the table/grid only. Header, filters, and view toggle
 * stay mounted so a search feels like a data refresh, not a page reload.
 */
@Component({
  selector: 'app-list-results',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-list-results" [class.is-busy]="busy" [attr.aria-busy]="busy">
      <div class="app-list-results__overlay" *ngIf="busy">
        <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
        <span>{{ busyLabel }}</span>
      </div>
      <ng-content></ng-content>
    </div>
  `,
  styleUrl: './app-list-results.component.scss'
})
export class AppListResultsComponent {
  @Input() busy = false;
  @Input() busyLabel = 'Updating results…';
}
