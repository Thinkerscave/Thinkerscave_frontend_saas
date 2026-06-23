import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-staff-alumni',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  styleUrls: ['../../staff.shared.scss'],
  template: `
    <section class="sd-workspace">
      <header class="sd-header">
        <div class="sd-header__left">
          <h1 class="sd-header__title">Alumni Staff</h1>
          <p class="sd-header__sub">View past staff members.</p>
        </div>
      </header>
      <div class="sp-empty-state" style="background: var(--tc-surface-0); border: 1px solid var(--tc-border); border-radius: 12px;">
        <i class="pi pi-users"></i>
        <h3>Coming Soon</h3>
        <p>The alumni staff module is currently being redesigned.</p>
      </div>
    </section>
  `
})
export class StaffAlumniComponent {}
