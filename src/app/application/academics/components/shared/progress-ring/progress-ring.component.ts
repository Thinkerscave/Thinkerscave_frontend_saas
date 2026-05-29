import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AcademicsTone } from '../../../models/academics-workspace.model';

@Component({
  selector: 'app-academic-progress-ring',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="acad-progress-ring" [ngClass]="'tone-' + tone" [style.--progress]="safeValue">
      <span>{{ safeValue }}%</span>
    </div>
  `
})
export class AcademicProgressRingComponent {
  @Input() value = 0;
  @Input() tone: AcademicsTone = 'primary';

  get safeValue(): number {
    return Math.max(0, Math.min(100, Math.round(Number(this.value) || 0)));
  }
}
