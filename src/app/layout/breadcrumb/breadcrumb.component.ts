import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BreadcrumbModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent implements OnInit {
  items: MenuItem[] = [];
  home: MenuItem = { icon: 'pi pi-home', routerLink: ['/app'] };
  title = 'Dashboard';

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.refreshBreadcrumb();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.refreshBreadcrumb());
  }

  private refreshBreadcrumb(): void {
    const labels = this.routeLabels(this.router.url);
    this.title = labels.at(-1) ?? 'Dashboard';
    this.items = labels.map(label => ({ label }));
    this.cdr.markForCheck();
  }

  private routeLabels(url: string): string[] {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter(Boolean);

    if (!segments.length || cleanUrl === '/app') {
      return ['Dashboard'];
    }

    if (segments[0] === 'public') {
      return ['Public', this.titleCase(segments[1] ?? 'admission')];
    }

    const workspace = segments[1] ?? 'dashboard';
    const page = segments[2] ?? '';

    const workspaceLabels: Record<string, string> = {
      admin: 'Administration',
      students: 'Students',
      staff: 'Staff',
      attendance: 'Attendance',
      inquiry: 'Admissions',
      academics: 'Academics',
      fees: 'Finance',
      reports: 'Finance',
      profile: 'Profile',
      settings: 'Settings'
    };

    if (workspace === 'dashboard' || workspace === '') {
      return ['Dashboard'];
    }

    const rootLabel = workspaceLabels[workspace] ?? this.titleCase(workspace);
    const pageLabel = this.routePageLabel(workspace, page);
    return pageLabel ? [rootLabel, pageLabel] : [rootLabel];
  }

  private routePageLabel(workspace: string, page: string): string {
    if (!page) {
      return workspace === 'fees' ? 'Dashboard' : '';
    }

    const labels: Record<string, Record<string, string>> = {
      admin: { dashboard: 'Dashboard', organizations: 'Organizations', access: 'Access Control', monitoring: 'Monitoring', audit: 'Audit Center' },
      students: { dashboard: 'Dashboard', directory: 'Directory', profiles: 'Profiles', admissions: 'Admissions', classes: 'Classes', sections: 'Sections', promotion: 'Promotion Center', transfer: 'Transfer Center', documents: 'Documents', parents: 'Parents', 'id-cards': 'ID Cards', alumni: 'Alumni' },
      staff: { dashboard: 'Dashboard', directory: 'Directory', operations: 'Operations' },
      attendance: { dashboard: 'Dashboard', students: 'Student Attendance', staff: 'Staff Attendance' },
      inquiry: { dashboard: 'Dashboard', pipeline: 'Pipeline', management: 'Management', 'follow-ups': 'Follow-ups', counseling: 'Counseling', applications: 'Applications', documents: 'Documents', communication: 'Communication', analytics: 'Analytics' },
      academics: { dashboard: 'Dashboard', years: 'Academic Years', classes: 'Classes', subjects: 'Subjects', curriculum: 'Curriculum', syllabus: 'Syllabus', 'teacher-allocation': 'Teacher Allocation', 'class-teacher-allocation': 'Class Teachers', timetable: 'Timetable', calendar: 'Calendar', hierarchy: 'Hierarchy', settings: 'Settings' },
      fees: { dashboard: 'Dashboard', setup: 'Setup', contracts: 'Contracts', ledger: 'Ledger', payments: 'Payments', receipts: 'Receipts', adjustments: 'Adjustments', controls: 'Controls', reports: 'Reports', audit: 'Audit Logs', 'my-fees': 'My Fees' }
    };

    return labels[workspace]?.[page] ?? this.titleCase(page);
  }

  private titleCase(value: string): string {
    return value
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, char => char.toUpperCase());
  }
}
