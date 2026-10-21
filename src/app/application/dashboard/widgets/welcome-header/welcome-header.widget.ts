import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { WelcomeHeaderData, WidgetState } from '../../models/dashboard.model';

export type SetupCardMode = 'hidden' | 'loading' | 'error' | 'ready';

/**
 * Greeting strip plus the compact Organization Setup card. The card is
 * shown only while mandatory setup is incomplete (backend `showSetupGuide`).
 */
@Component({
  selector: 'tc-welcome-header-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './welcome-header.widget.html',
  styleUrl: './welcome-header.widget.scss'
})
export class WelcomeHeaderWidgetComponent {
  private readonly router = inject(Router);

  @Input() data?: WelcomeHeaderData;
  @Input() state: WidgetState = 'LOADING';

  initials(): string {
    const name = this.data?.displayName || '?';
    return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
  }

  get setupMode(): SetupCardMode {
    if (this.state === 'LOADING') return 'loading';
    if (this.state === 'ERROR' || this.data?.setupError) return 'error';
    return this.data?.showSetupGuide ? 'ready' : 'hidden';
  }

  get completedCount(): number {
    return this.data?.setupCompletedCount ?? 0;
  }

  get totalCount(): number {
    return this.data?.setupTotalCount ?? 0;
  }

  get progressPercent(): number {
    return Math.min(100, Math.max(0, this.data?.setupProgressPercent ?? 0));
  }

  continueSetup(): void {
    void this.router.navigateByUrl('/app/onboarding');
  }
}
