import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tc-auth-trust-strip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './auth-trust-strip.component.html',
  styleUrl: './auth-trust-strip.component.scss'
})
export class AuthTrustStripComponent {
  readonly items = [
    { icon: 'pi-shield', label: 'Enterprise Security', detail: 'Your data is always protected' },
    { icon: 'pi-cloud', label: 'Cloud Native', detail: '99.99% uptime SLA' },
    { icon: 'pi-lock', label: 'Encrypted', detail: 'End-to-end protection' }
  ];
}
