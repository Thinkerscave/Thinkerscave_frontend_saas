import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SaasPageHeaderComponent, SaasPanelComponent } from '../../../../shared/ui/saas';

interface AttendanceSettings {
  mode: 'DAILY' | 'PERIOD';
  startTime: string;
  endTime: string;
  lateAfter: string;
  minAttendancePct: number;
  allowEdit: boolean;
  freezeAfterDays: number;
  notifySms: boolean;
  notifyWhatsapp: boolean;
  notifyPush: boolean;
  notifyEmail: boolean;
}

@Component({
  selector: 'app-attendance-settings',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, SaasPageHeaderComponent, SaasPanelComponent],
  templateUrl: './attendance-settings.component.html',
  styleUrl: './attendance-settings.component.scss'
})
export class AttendanceSettingsComponent {
  settings: AttendanceSettings = {
    mode: 'DAILY',
    startTime: '08:00',
    endTime: '14:30',
    lateAfter: '08:15',
    minAttendancePct: 75,
    allowEdit: true,
    freezeAfterDays: 7,
    notifySms: true,
    notifyWhatsapp: true,
    notifyPush: true,
    notifyEmail: false
  };

  saved = false;

  save(): void {
    this.saved = true;
    setTimeout(() => { this.saved = false; }, 2400);
  }
}
