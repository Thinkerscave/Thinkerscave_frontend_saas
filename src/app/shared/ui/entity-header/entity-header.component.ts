import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { UiSummaryItem, UiTone } from '../ui-models';

@Component({
  selector: 'tc-entity-header',
  standalone: true,
  imports: [CommonModule, AvatarComponent, StatusBadgeComponent],
  templateUrl: './entity-header.component.html',
  styleUrls: ['./entity-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityHeaderComponent {
  @Input() title = '';
  @Input() subtitle: string | null = null;
  @Input() imageUrl: string | null = null;
  @Input() status: string | null = null;
  @Input() statusTone: UiTone = 'neutral';
  @Input() meta: UiSummaryItem[] = [];
}