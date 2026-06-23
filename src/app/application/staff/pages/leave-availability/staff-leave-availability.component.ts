import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-staff-leave-availability',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  styleUrls: ['../../staff.shared.scss'],
  template: `
    <section class="sd-workspace">
      <header class="sd-header">
        <div class="sd-header__left">
          <h1 class="sd-header__title">Leave & Availability</h1>
          <p class="sd-header__sub">Manage staff leaves, attendance and availability.</p>
        </div>
      </header>
      <div class="sp-empty-state" style="background: var(--tc-surface-0); border: 1px solid var(--tc-border); border-radius: 12px;">
        <i class="pi pi-calendar-times"></i>
        <h3>Coming Soon</h3>
        <p>The leave and availability module is currently being redesigned.</p>
      </div>
    </section>
  `
})
export class StaffLeaveAvailabilityComponent {}
