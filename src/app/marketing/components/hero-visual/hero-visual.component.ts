import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'tc-hero-visual',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './hero-visual.component.html',
  styleUrl: './hero-visual.component.scss'
})
export class HeroVisualComponent {}
