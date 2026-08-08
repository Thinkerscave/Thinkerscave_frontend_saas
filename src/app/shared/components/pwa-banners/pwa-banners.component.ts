import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PwaService } from '../../../core/services/pwa.service';

@Component({
  selector: 'app-pwa-banners',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './pwa-banners.component.html',
  styleUrl: './pwa-banners.component.scss'
})
export class PwaBannersComponent {
  readonly pwa = inject(PwaService);

  install(): void {
    void this.pwa.promptInstall();
  }

  dismissInstall(): void {
    this.pwa.dismissInstall();
  }

  applyUpdate(): void {
    void this.pwa.applyUpdate();
  }

  dismissUpdate(): void {
    this.pwa.dismissUpdate();
  }
}
