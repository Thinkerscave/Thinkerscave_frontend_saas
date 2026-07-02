import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-staff-leave-availability',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink],
  styleUrls: ['../../staff.shared.scss'],
  templateUrl: './staff-leave-availability.component.html'
})
export class StaffLeaveAvailabilityComponent {
  readonly kpis = [
    { label: 'Present Today', value: '—', icon: 'pi-check-circle', color: 'green' },
    { label: 'On Leave', value: '—', icon: 'pi-calendar-minus', color: 'amber' },
    { label: 'Pending Requests', value: '—', icon: 'pi-clock', color: 'orange' },
    { label: 'Upcoming Leaves', value: '—', icon: 'pi-calendar', color: 'blue' }
  ];
}
