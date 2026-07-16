import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { WelcomeHeaderData, WidgetState } from '../../models/dashboard.model';

/**
 * Hero banner — deliberately not wrapped in `tc-widget-card` since it acts
 * as the page's greeting strip rather than a data widget, but still honors
 * the loading/error contract so it never flashes broken content.
 */
@Component({
  selector: 'tc-welcome-header-widget',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './welcome-header.widget.html',
  styleUrl: './welcome-header.widget.scss'
})
export class WelcomeHeaderWidgetComponent {
  @Input() data?: WelcomeHeaderData;
  @Input() state: WidgetState = 'LOADING';

  initials(): string {
    const name = this.data?.displayName || '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
  }
}
