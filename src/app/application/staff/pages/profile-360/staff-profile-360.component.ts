import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { finalize } from 'rxjs';

import {
  ResponsibilityAssignment,
  ResponsibilityAssignmentRequest,
  Responsibility,
  StaffDetail
} from '../../models/staff.model';
import { StaffService } from '../../services/staff.service';
import { AvatarComponent } from '../../../../shared/ui/avatar/avatar.component';
import { SaasPageHeaderComponent } from '../../../../shared/ui/saas';
import { BreadCrumbService } from '../../../../core/services/bread-crumb.service';

type ProfileTab = 'overview' | 'responsibilities' | 'documents' | 'activity';

interface TabConfig { id: ProfileTab; label: string; icon: string; }

@Component({
  selector: 'app-staff-profile-360',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, AvatarComponent, SaasPageHeaderComponent],
  styleUrls: ['../../staff.shared.scss'],
  templateUrl: './staff-profile-360.component.html'
})
export class StaffProfile360Component implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  private readonly api = inject(StaffService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly pageHeader = inject(BreadCrumbService);

  loading = true;
  errorMessage = '';
  actionLoading = false;

  staffId = 0;
  profile?: StaffDetail;

  activeTab: ProfileTab = 'overview';

  readonly tabs: TabConfig[] = [
    { id: 'overview',         label: 'Overview',         icon: 'pi-user' },
    { id: 'responsibilities', label: 'Responsibilities', icon: 'pi-sitemap' },
    { id: 'documents',        label: 'Documents',        icon: 'pi-folder-open' },
    { id: 'activity',         label: 'Activity',         icon: 'pi-history' }
  ];

  // ── Assign Responsibility Modal ──────────────────────────────────────────────
  showAssignModal = false;
  allResponsibilities: Responsibility[] = [];
  assignForm: ResponsibilityAssignmentRequest = this.emptyAssignForm();

  get responsibilityOptions(): { label: string; value: number }[] {
    return [
      { label: 'Select Responsibility', value: 0 },
      ...this.allResponsibilities.map(r => ({
        label: `${r.responsibilityName} (${r.responsibilityCode})`,
        value: r.responsibilityId ?? 0
      }))
    ];
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(p => {
      const id = Number(p.get('id'));
      if (!id) { this.errorMessage = 'Invalid staff ID.'; this.loading = false; this.cdr.markForCheck(); return; }
      this.staffId = id;
      const tab = this.route.snapshot.queryParamMap.get('tab') as ProfileTab | null;
      if (tab && this.tabs.some(t => t.id === tab)) {
        this.activeTab = tab;
      }
      this.load();
    });
  }

  load(): void {
    this.loading = true;
    this.api.getStaffDetail(this.staffId)
      .pipe(finalize(() => { this.loading = false; this.cdr.markForCheck(); }))
      .subscribe({
        next: profile => {
          this.profile = profile;
          this.pageHeader.setPageHeader({
            subtitle: [profile.staffCode, profile.designation].filter(Boolean).join(' · ')
          });
        },
        error: () => { this.errorMessage = 'Unable to load profile.'; }
      });
  }

  setTab(tab: ProfileTab): void {
    this.activeTab = tab;
  }

  get activeResponsibilityCount(): number {
    return (this.profile?.responsibilities ?? []).filter(r => r.active).length;
  }

  /** Whether the tab-contextual sidebar has anything meaningful to show for the active tab. */
  get hasContextualSidebar(): boolean {
    if (!this.profile) { return false; }
    return this.activeTab === 'responsibilities';
  }

  // ── Quick Actions ────────────────────────────────────────────────────────────

  editProfile(): void {
    this.router.navigate(['/app/staff/edit', this.staffId]);
  }

  toggleActive(): void {
    if (!this.profile) { return; }
    this.actionLoading = true;
    const obs = this.profile.active
      ? this.api.deactivateStaff(this.staffId)
      : this.api.activateStaff(this.staffId);
    obs.pipe(finalize(() => { this.actionLoading = false; this.cdr.markForCheck(); }))
      .subscribe({ next: () => { if (this.profile) { this.profile.active = !this.profile.active; } } });
  }

  // ── Assign Responsibility ────────────────────────────────────────────────────

  openAssignModal(): void {
    if (this.allResponsibilities.length === 0) {
      this.api.getResponsibilities().subscribe(r => {
        this.allResponsibilities = r;
        this.cdr.markForCheck();
      });
    }
    this.assignForm = this.emptyAssignForm();
    this.showAssignModal = true;
  }

  emptyAssignForm(): ResponsibilityAssignmentRequest {
    return {
      staffId: this.staffId,
      responsibilityId: 0,
      scope: '',
      effectiveFrom: new Date().toISOString().substring(0, 10)
    };
  }

  saveAssignment(): void {
    if (!this.assignForm.responsibilityId) { return; }
    this.assignForm.staffId = this.staffId;
    this.api.assignResponsibility(this.assignForm)
      .subscribe({
        next: () => {
          this.showAssignModal = false;
          this.load();
        }
      });
  }

  removeAssignment(assignment: ResponsibilityAssignment): void {
    if (!confirm(`Remove responsibility "${assignment.responsibilityName}"?`)) { return; }
    this.api.removeAssignment(assignment.assignmentId)
      .subscribe({ next: () => { this.load(); } });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────────

  initials(name?: string): string {
    if (!name) { return '?'; }
    return name.split(' ').map(p => p.charAt(0)).slice(0, 2).join('').toUpperCase();
  }

  trackByIdx(i: number): number { return i; }
  trackByAssignId(_: number, a: ResponsibilityAssignment): number { return a.assignmentId; }
}
