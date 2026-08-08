import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ButtonModule } from 'primeng/button';

export type EmptyStateIllustration =
  | 'students'
  | 'staff'
  | 'data'
  | 'search'
  | 'locked'
  | 'notFound'
  | 'expired'
  | 'maintenance'
  | 'none';

/**
 * Friendly empty-state with optional SVG illustration.
 * Prefer illustration over icon for primary list/workspace empties and system error pages.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  /** Legacy icon class; ignored when illustration !== 'none'. */
  @Input() icon = 'pi pi-inbox';
  @Input() illustration: EmptyStateIllustration = 'none';
  @Input() title = 'Nothing here yet';
  @Input() message: string | null = null;
  @Input() actionLabel: string | null = null;
  @Input() actionIcon: string | null = null;
  @Input() compact = false;
  /** Full-page system errors: no dashed panel border. */
  @Input() page = false;
  @Output() action = new EventEmitter<void>();

  get showIllustration(): boolean {
    return this.illustration !== 'none';
  }
}
