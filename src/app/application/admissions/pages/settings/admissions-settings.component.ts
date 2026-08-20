import { CommonModule, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { MessageService } from 'primeng/api';
import { AppToastComponent } from '../../../../core/feedback/app-toast.component';
import { finalize } from 'rxjs';

import { AdmissionsSettings } from '../../models/admissions-crm.model';
import { AdmissionsCrmService } from '../../services/admissions-crm.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-admissions-crm-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppToastComponent, 
    CommonModule,
    KeyValuePipe,
    SaasPageHeaderComponent,
    SaasPanelComponent
  ],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './admissions-settings.component.html'
})
export class AdmissionsSettingsComponent implements OnInit {
  private readonly api = inject(AdmissionsCrmService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  loading = false;
  errorMessage = '';
  settings: AdmissionsSettings | null = null;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.api
      .settings()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: s => {
          this.settings = s;
          this.errorMessage = '';
        },
        error: () => {
          this.errorMessage = 'Unable to load admissions settings.';
          this.messages.add({
            severity: 'error',
            summary: 'Load failed',
            detail: this.errorMessage
          });
        }
      });
  }

  refresh(): void {
    this.load();
    this.messages.add({
      severity: 'info',
      summary: 'Refreshing',
      detail: 'Reloading settings from server.'
    });
  }

  formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .trim()
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  hasEntries(map: Record<string, string> | null | undefined): boolean {
    return !!map && Object.keys(map).length > 0;
  }
}
