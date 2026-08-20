import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { UI_TOAST_CONFIG, UiToastPosition } from '../config/ui-toast.config';

/**
 * App-wide toast host. Position comes from {@link UI_TOAST_CONFIG} so it
 * can be changed in one file.
 */
@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [ToastModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p-toast [position]="position" [key]="toastKey" [baseZIndex]="baseZIndex" />`
})
export class AppToastComponent {
  /** Optional PrimeNG toast key when a page uses an isolated MessageService. */
  @Input() key?: string;

  readonly position: UiToastPosition = UI_TOAST_CONFIG.position;
  readonly baseZIndex = UI_TOAST_CONFIG.baseZIndex;

  get toastKey(): string | undefined {
    const value = this.key?.trim();
    return value ? value : undefined;
  }
}
