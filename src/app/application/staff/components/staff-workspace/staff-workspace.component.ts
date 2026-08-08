import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-staff-workspace',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <router-outlet />
  `,
  styles: [':host { display: block; }']
})
export class StaffWorkspaceComponent {}
