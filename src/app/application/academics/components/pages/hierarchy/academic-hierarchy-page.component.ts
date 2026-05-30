import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output , ChangeDetectionStrategy} from '@angular/core';
import { AcademicContainerModel, AcademicsActionMode, AcademicsWorkspaceData } from '../../../models/academics-workspace.model';
import { AcademicEmptyStateComponent } from '../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-academic-hierarchy-page',
    changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, AcademicEmptyStateComponent],
  template: `
    <section class="acad-panel acad-hierarchy-panel">
      <div class="acad-section-head">
        <div>
          <span>Visual organizational tree</span>
          <h2>School > Wing > Stream > Class > Section</h2>
        </div>
        <button type="button" class="acad-primary-button" (click)="actionRequested.emit('section')"><i class="pi pi-plus"></i>Create section</button>
      </div>

      <app-academic-empty-state *ngIf="!data.containers.length" icon="pi pi-share-alt" title="No hierarchy nodes available" description="Seed or create academic containers to visualize the institution tree." actionLabel="Create section" (action)="actionRequested.emit('section')"></app-academic-empty-state>

      <div class="acad-tree" *ngIf="data.containers.length">
        <article *ngFor="let node of rootNodes" class="acad-tree-node root">
          <div class="acad-node-card">
            <i class="pi pi-building"></i>
            <div><strong>{{ node.containerName }}</strong><small>{{ node.containerType }} · {{ node.currentStrength || 0 }}/{{ node.capacity || 0 }}</small></div>
          </div>
          <div class="acad-tree-children">
            <article *ngFor="let child of childrenOf(node)" class="acad-tree-node">
              <div class="acad-node-card">
                <i class="pi pi-sitemap"></i>
                <div><strong>{{ child.containerName }}</strong><small>{{ child.containerType }} · Level {{ child.level || '-' }}</small></div>
              </div>
              <div class="acad-tree-children leaf">
                <article *ngFor="let grandChild of childrenOf(child)" class="acad-node-card small">
                  <i class="pi pi-circle"></i>
                  <div><strong>{{ grandChild.containerName }}</strong><small>{{ grandChild.currentStrength || 0 }}/{{ grandChild.capacity || 0 }}</small></div>
                </article>
              </div>
            </article>
          </div>
        </article>
      </div>
    </section>
  `
})
export class AcademicHierarchyPageComponent {
  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();

  get rootNodes(): AcademicContainerModel[] {
    const roots = this.data.containers.filter(item => !item.parentContainerId);
    return roots.length ? roots : this.data.containers.filter(item => (item.level ?? 1) === 1);
  }

  childrenOf(parent: AcademicContainerModel): AcademicContainerModel[] {
    return this.data.containers.filter(item => Number(item.parentContainerId) === Number(parent.containerId));
  }
}
