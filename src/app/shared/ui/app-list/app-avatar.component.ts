import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export type AppAvatarSize = 'sm' | 'md' | 'lg';

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #609afa 0%, #2556eb 100%)',
  'linear-gradient(135deg, #34d399 0%, #059669 100%)',
  'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
  'linear-gradient(135deg, #fb7185 0%, #e11d48 100%)',
  'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
  'linear-gradient(135deg, #22d3ee 0%, #0891b2 100%)'
];

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function initialsFromName(name?: string | null): string {
  if (!name?.trim()) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?';
}

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="app-avatar"
      [class.app-avatar--sm]="size === 'sm'"
      [class.app-avatar--lg]="size === 'lg'"
      [style.background]="logoUrl ? null : gradient"
      [attr.aria-label]="name || 'Avatar'">
      <img *ngIf="logoUrl" [src]="logoUrl" [alt]="name || 'Logo'" loading="lazy" />
      <span *ngIf="!logoUrl" class="app-avatar__initials">{{ initials }}</span>
    </span>
  `,
  styleUrl: './app-avatar.component.scss'
})
export class AppAvatarComponent {
  @Input() name = '';
  @Input() logoUrl: string | null = null;
  @Input() size: AppAvatarSize = 'md';

  get initials(): string {
    return initialsFromName(this.name);
  }

  get gradient(): string {
    const key = this.name || 'default';
    return AVATAR_GRADIENTS[hashString(key) % AVATAR_GRADIENTS.length];
  }
}
