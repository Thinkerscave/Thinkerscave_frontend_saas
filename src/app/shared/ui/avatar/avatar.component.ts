import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';

@Component({
  selector: 'tc-avatar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AvatarComponent implements OnChanges {
  @Input() name = '';
  @Input() imageUrl: string | null | undefined = null;
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';

  imageFailed = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['imageUrl']) {
      this.imageFailed = false;
    }
  }

  get initials(): string {
    return this.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'TC';
  }

  onImageError(): void {
    this.imageFailed = true;
  }
}
