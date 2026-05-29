import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AcademicsNavGroup, AcademicsPageConfig, AcademicsWorkspacePage } from '../../../models/academics-workspace.model';

@Component({
  selector: 'app-academic-workspace-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="acad-workspace-nav" aria-label="Academics workspace navigation">
      <div class="acad-nav-head">
        <span><i class="pi pi-sparkles"></i></span>
        <div>
          <strong>Academics</strong>
          <small>Guided workspace</small>
        </div>
      </div>

      <div *ngFor="let group of groups" class="acad-nav-group">
        <div class="acad-nav-group-title"><i [ngClass]="group.icon"></i>{{ group.label }}</div>
        <a *ngFor="let item of pagesFor(group)" [routerLink]="item.route" class="acad-nav-link" [class.is-active]="item.page === activePage" (click)="navigated.emit(item.page)">
          <i [ngClass]="item.icon"></i>
          <span>{{ item.label }}</span>
        </a>
      </div>
    </aside>
  `
})
export class AcademicWorkspaceNavComponent {
  @Input() groups: AcademicsNavGroup[] = [];
  @Input() pages: AcademicsPageConfig[] = [];
  @Input() activePage: AcademicsWorkspacePage = 'dashboard';
  @Output() navigated = new EventEmitter<AcademicsWorkspacePage>();

  pagesFor(group: AcademicsNavGroup): AcademicsPageConfig[] {
    return group.pages
      .map(page => this.pages.find(item => item.page === page))
      .filter((item): item is AcademicsPageConfig => item !== undefined);
  }
}
