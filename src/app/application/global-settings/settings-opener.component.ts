import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SettingsUiService } from '../../core/services/settings-ui.service';

/**
 * Deep-link entry for /app/settings — opens the shell drawer and returns
 * to the previous workspace page instead of rendering a full settings page.
 */
@Component({
  selector: 'tc-settings-opener',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ''
})
export class SettingsOpenerComponent implements OnInit {
  private readonly settingsUi = inject(SettingsUiService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.settingsUi.open();
    const back = this.settingsUi.consumeReturnUrl();
    void this.router.navigateByUrl(back || '/app', { replaceUrl: true });
  }
}
