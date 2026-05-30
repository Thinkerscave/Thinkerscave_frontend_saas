import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UiActivityItem } from '../ui-models';

@Component({
  selector: 'tc-activity-feed',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './activity-feed.component.html',
  styleUrls: ['./activity-feed.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ActivityFeedComponent {
  @Input() title = 'Activity feed';
  @Input() items: UiActivityItem[] = [];
}