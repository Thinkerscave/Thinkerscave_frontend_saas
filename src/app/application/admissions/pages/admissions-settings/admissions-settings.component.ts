import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';

import { AdmissionsSettings } from '../../models/admissions-workspace.model';
import { AdmissionsWorkspaceService } from '../../services/admissions-workspace.service';

@Component({
  selector: 'app-admissions-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  styleUrls: ['../../admissions.shared.scss'],
  templateUrl: './admissions-settings.component.html'
})
export class AdmissionsSettingsComponent implements OnInit {
  private readonly api = inject(AdmissionsWorkspaceService);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = true;
  errorMessage = '';
  settings?: AdmissionsSettings;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.api.settings()
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: s => this.settings = s,
        error: () => this.errorMessage = 'Unable to load admissions settings.'
      });
  }
}
