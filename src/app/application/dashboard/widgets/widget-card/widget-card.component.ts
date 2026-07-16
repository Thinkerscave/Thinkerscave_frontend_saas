import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DataMode, WidgetState } from '../../models/dashboard.model';

/**
 * Shared card shell used by every dashboard widget. Owns the
 * loading/skeleton, empty, and error chrome so individual widgets only ever
 * need to implement their `SUCCESS` body via content projection — a single
 * widget's failure or emptiness never leaks presentation concerns into
 * siblings.
 */
@Component({
  selector: 'tc-widget-card',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './widget-card.component.html',
  styleUrl: './widget-card.component.scss'
})
export class WidgetCardComponent {
  @Input() title?: string;
  @Input() subtitle?: string;
  @Input() icon?: string;
  @Input() state: WidgetState = 'LOADING';
  @Input() dataMode: DataMode = 'LIVE';
  @Input() errorMessage?: string;
  @Input() emptyMessage = 'Nothing to show here yet.';
  @Input() emptyIcon = 'pi pi-inbox';
  @Input() skeletonRows = 3;
  @Input() bodyClass = '';
  @Output() retry = new EventEmitter<void>();

  get isSample(): boolean {
    return this.dataMode === 'SAMPLE';
  }

  get skeletonRowsArr(): number[] {
    return Array.from({ length: Math.max(1, this.skeletonRows) });
  }
}
