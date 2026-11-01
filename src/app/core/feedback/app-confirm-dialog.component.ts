import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { APP_CONFIRM_KEY } from './ui-confirm.service';

/** App-wide host for {@link UiConfirmService}. Mount once in `app.component.html`. */
@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ConfirmDialogModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p-confirmDialog
      [key]="key"
      [style]="{ width: '440px' }"
      [breakpoints]="{ '575px': '92vw' }"
      [draggable]="false"
      [dismissableMask]="false"
      appendTo="body" />
  `
})
export class AppConfirmDialogComponent {
  readonly key = APP_CONFIRM_KEY;
}
