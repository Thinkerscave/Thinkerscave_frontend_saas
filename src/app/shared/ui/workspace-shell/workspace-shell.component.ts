import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { KpiCardComponent } from '../../components/kpi-card/kpi-card.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { UiAction, UiDensity, UiNavItem, UiStat } from '../ui-models';

@Component({
  selector: 'tc-workspace-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent, KpiCardComponent, SkeletonComponent],
  templateUrl: './workspace-shell.component.html',
  styleUrls: ['./workspace-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceShellComponent {
  @Input() title = '';
  @Input() eyebrow: string | null = null;
  @Input() description: string | null = null;
  @Input() icon = 'pi pi-th-large';
  @Input() navItems: UiNavItem[] = [];
  @Input() activeId = '';
  @Input() stats: UiStat[] = [];
  @Input() actions: UiAction[] = [];
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() density: UiDensity = 'comfortable';

  @Output() activeIdChange = new EventEmitter<string>();
  @Output() actionSelected = new EventEmitter<UiAction>();
  @Output() retry = new EventEmitter<void>();

  selectNav(item: UiNavItem): void {
    if (!item.disabled && !item.routerLink) {
      this.activeIdChange.emit(item.id);
    }
  }

  selectAction(action: UiAction): void {
    if (!action.disabled) {
      this.actionSelected.emit(action);
    }
  }

  isVisible(action: UiAction): boolean {
    return action.visible !== false;
  }
}