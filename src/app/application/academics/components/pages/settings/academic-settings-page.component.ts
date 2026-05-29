import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AcademicSettingModel, AcademicsActionMode, AcademicsWorkspaceData } from '../../../models/academics-workspace.model';
import { AcademicEmptyStateComponent } from '../../shared/empty-state/empty-state.component';

@Component({
  selector: 'app-academic-settings-page',
  standalone: true,
  imports: [CommonModule, AcademicEmptyStateComponent],
  template: `
    <section class="acad-panel acad-settings-panel">
      <div class="acad-section-head">
        <div>
          <span>Categorized settings panels</span>
          <h2>Academic rules and defaults</h2>
        </div>
        <button type="button" class="acad-primary-button" (click)="actionRequested.emit('settings')"><i class="pi pi-save"></i>Update setting</button>
      </div>

      <app-academic-empty-state *ngIf="!data.academicSettings.length" icon="pi pi-cog" title="No academic settings configured" description="Create rule defaults for timetable, attendance, grading, promotion or curriculum." actionLabel="Update setting" (action)="actionRequested.emit('settings')"></app-academic-empty-state>

      <div class="acad-settings-grid" *ngIf="data.academicSettings.length">
        <section *ngFor="let group of categories">
          <header><i class="pi pi-sliders-h"></i>{{ group }}</header>
          <article *ngFor="let setting of settingsFor(group)">
            <div>
              <strong>{{ humanize(setting.settingKey) }}</strong>
              <p>{{ setting.description || 'Academic default rule.' }}</p>
            </div>
            <span class="acad-setting-value">{{ setting.settingValue }}</span>
          </article>
        </section>
      </div>
    </section>
  `
})
export class AcademicSettingsPageComponent {
  @Input({ required: true }) data!: AcademicsWorkspaceData;
  @Output() actionRequested = new EventEmitter<AcademicsActionMode>();

  get categories(): string[] {
    return Array.from(new Set(this.data.academicSettings.map(item => item.category || 'GENERAL')));
  }

  settingsFor(category: string): AcademicSettingModel[] {
    return this.data.academicSettings.filter(item => (item.category || 'GENERAL') === category);
  }

  humanize(value?: string): string {
    return (value || 'Setting').replace(/_/g, ' ').toLowerCase().replace(/(^|\s)\S/g, match => match.toUpperCase());
  }
}
