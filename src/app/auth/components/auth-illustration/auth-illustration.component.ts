import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type AuthIllustrationTone = 'light' | 'deep';

@Component({
  selector: 'tc-auth-illustration',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './auth-illustration.component.html',
  styleUrl: './auth-illustration.component.scss'
})
export class AuthIllustrationComponent {
  /** Visual intensity — login uses a slightly deeper atmosphere. */
  readonly tone = input<AuthIllustrationTone>('light');

  readonly headline = input('Empowering Education.');
  readonly subline = input('Inspiring Futures.');
  readonly caption = input(
    'One intelligent platform connecting students, teachers, administrators, and parents.'
  );
}
