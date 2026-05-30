import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiAction } from '../ui-models';

@Component({
  selector: 'tc-quick-actions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './quick-actions.component.html',
  styleUrls: ['./quick-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QuickActionsComponent {
  @Input() title = 'Quick actions';
  @Input() actions: UiAction[] = [];
  @Output() actionSelected = new EventEmitter<UiAction>();

  select(action: UiAction): void {
    if (!action.disabled) {
      this.actionSelected.emit(action);
    }
  }
}