import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SaasPageHeaderComponent } from '../../../../../shared/ui/saas/saas-primitives';
import { TcAcademicYearSelectorComponent } from '../../../../../shared/ui/academic-year-selector';
import { MessageService } from 'primeng/api';
import { finalize, map } from 'rxjs';
import { AcademicsMeApiService } from '../../../services/academics-me-api.service';
import { LoginService } from '../../../../../core/services/login.service';
import { roleTokensFromUser } from '../../../../../core/utils/workspace-home';
import { ACADEMICS_ACADEMIC_STRUCTURE_RESOURCE, AcademicStructureTreeStage, TeacherAcademicStructure } from '../../../models/academics-me.model';

import { TcPageSkeletonComponent } from '../../../../../shared/ui/loading';

@Component({
  selector: 'app-academic-structure-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterLink, SaasPageHeaderComponent, TcAcademicYearSelectorComponent, TcPageSkeletonComponent
  ],
  templateUrl: './academic-structure.component.html',
  styleUrls: ['./academic-structure.component.scss']
})
export class AcademicStructurePageComponent {
  private readonly api = inject(AcademicsMeApiService);
  private readonly login = inject(LoginService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly messages = inject(MessageService);

  readonly resource = ACADEMICS_ACADEMIC_STRUCTURE_RESOURCE;
  readonly isAdminView = roleTokensFromUser(this.login.getUser())
    .some(role => ['ORGANIZATION_ADMIN', 'ORGANIZATION_OWNER'].includes(role));
  loading = true;
  selectedYearId: number | null = null;
  selectedAcademicGroupId: number | null = null;
  data: TeacherAcademicStructure | null = null;

  onAcademicYearChange(yearId: number | null): void {
    this.selectedYearId = yearId;
    if (yearId == null) {
      this.data = null;
      this.selectedAcademicGroupId = null;
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }
    this.reload();
  }

  reload(): void {
    if (!this.selectedYearId) return;
    this.loading = true;
    const request = this.isAdminView
      ? this.api.structureByYear(this.selectedYearId).pipe(map(stages => this.toStructure(stages, this.selectedYearId!)))
      : this.api.myStructure(this.selectedYearId);
    request
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: (d) => {
          this.data = d;
          const defaultGroup = d.academicGroups?.find(group => group.sections.length > 0)
            ?? d.academicGroups?.[0];
          this.selectedAcademicGroupId = defaultGroup?.academicGroupId ?? null;
        },
        error: (err) => this.messages.add({ severity: 'error', summary: 'Unable to load structure', detail: err?.error?.message })
      });
  }

  private toStructure(stages: AcademicStructureTreeStage[], academicYearId: number): TeacherAcademicStructure {
    return {
      academicYearId,
      academicYearName: '',
      academicGroups: stages.flatMap(stage => (stage.academicGroups ?? [])
        .filter(group => group.active !== false)
        .map(group => ({
          academicGroupId: group.academicGroupId,
          academicGroupName: group.academicGroupName,
          academicGroupCode: group.academicGroupCode,
          stage: stage.stage,
          sections: (group.sections ?? []).filter(section => section.active !== false).map(section => ({
            sectionId: section.sectionId,
            sectionName: section.sectionName,
            sectionCode: section.sectionCode,
            capacity: section.capacity,
            subjects: []
          }))
        }))
      )
    };
  }

  get selectedClass() {
    return this.data?.academicGroups?.find((c) => c.academicGroupId === this.selectedAcademicGroupId) || null;
  }

  get sectionCount(): number {
    return (this.data?.academicGroups || []).reduce((n, c) => n + (c.sections?.length || 0), 0);
  }

  get stageCount(): number {
    return new Set((this.data?.academicGroups || [])
      .map(group => group.stage)
      .filter((stage): stage is string => !!stage)).size;
  }

  get subjectCount(): number {
    const ids = new Set<number>();
    for (const c of this.data?.academicGroups || []) {
      for (const s of c.sections || []) {
        for (const sub of s.subjects || []) ids.add(sub.subjectId);
      }
    }
    return ids.size;
  }

  subjectCountFor(c: TeacherAcademicStructure['academicGroups'][number]): number {
    const ids = new Set<number>();
    for (const s of c.sections || []) {
      for (const sub of s.subjects || []) ids.add(sub.subjectId);
    }
    return ids.size;
  }
}
