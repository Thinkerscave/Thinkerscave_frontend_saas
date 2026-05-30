import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output , ChangeDetectionStrategy} from '@angular/core';
import { AcademicsQuickAction } from '../../../models/academics-workspace.model';

@Component({
  selector: 'app-academic-quick-action-bar',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="acad-quick-actions" aria-label="Academic quick actions">
      <button *ngFor="let action of actions" type="button" class="acad-action-tile" [ngClass]="'tone-' + action.tone" (click)="selected.emit(action)">
        <span class="acad-action-icon"><i [ngClass]="action.icon"></i></span>
        <span class="acad-action-copy">
          <strong>{{ action.label }}</strong>
          <small>{{ action.helper }}</small>
        </span>
      </button>
    </section>
  `
})
export class AcademicQuickActionBarComponent {
  @Input() actions: AcademicsQuickAction[] = [];
  @Output() selected = new EventEmitter<AcademicsQuickAction>();
}
