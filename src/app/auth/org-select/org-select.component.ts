import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import {
  LoginOrganization,
  OrganizationContextService,
  THINKERS_DEPARTMENT
} from '../../core/services/organization-context.service';

@Component({
  selector: 'app-org-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './org-select.component.html',
  styleUrl: './org-select.component.scss'
})
export class OrgSelectComponent implements OnInit {
  private readonly orgContext = inject(OrganizationContextService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly thinkersDepartment = THINKERS_DEPARTMENT;
  readonly query = signal('');
  readonly selected = signal<LoginOrganization | null>(null);
  readonly platformSelected = signal(false);

  readonly organizations = this.orgContext.organizations;
  readonly loading = this.orgContext.loading;
  readonly loadError = this.orgContext.loadError;

  readonly displayOrgs = computed(() => this.organizations());
  readonly hasSelection = computed(() => this.platformSelected() || !!this.selected());
  readonly resultCount = computed(() => this.organizations().length);

  ngOnInit(): void {
    // Initial load of all organizations
    this.orgContext.loadOrganizations().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    // Search observable with debounce
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) => this.orgContext.loadOrganizations(q || undefined)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  onSearch(value: string): void {
    const trimmed = value?.trim() ?? '';
    this.query.set(trimmed);
    this.selected.set(null);
    this.platformSelected.set(false);

    // If clearing search (empty value), reload all organizations immediately
    if (!trimmed) {
      this.orgContext.loadOrganizations().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
    } else {
      this.search$.next(trimmed);
    }
  }

  selectPlatform(): void {
    this.platformSelected.set(true);
    this.selected.set(null);
  }

  selectOrg(org: LoginOrganization): void {
    this.platformSelected.set(false);
    this.selected.set(org);
  }

  continue(): void {
    if (this.platformSelected()) {
      this.orgContext.setPlatformLogin();
      void this.router.navigate(['/auth/login']);
      return;
    }

    const org = this.selected();
    if (!org) {
      return;
    }
    this.orgContext.setSelectedOrganization(org);
    void this.router.navigate(['/auth/login']);
  }

  retry(): void {
    this.orgContext.loadOrganizations(this.query()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  initials(name: string): string {
    return (name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  isSelected(org: LoginOrganization): boolean {
    return this.selected()?.id === org.id;
  }

  trackByOrgId(_index: number, org: LoginOrganization): number {
    return org.id;
  }
}
