import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-validation-message',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p *ngIf="message" class="app-field__error" role="alert">
      <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
      {{ message }}
    </p>
  `,
  styleUrl: './app-validation-message.component.scss'
})
export class AppValidationMessageComponent {
  @Input() message = '';
}
