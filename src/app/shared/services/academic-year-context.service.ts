import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable, catchError, map, of, shareReplay, tap } from 'rxjs';
import { AcademicYearDto } from '../../application/academics/models/academic-year.model';
import { AcademicYearApiService } from '../../application/academics/services/academic-year-api.service';

const STORAGE_KEY = 'tc.selectedAcademicYearId';

/**
 * Shared academic-year context for year-scoped modules (Academics, Finance, Admissions).
 * Persists the selection across SPA navigation (sessionStorage). Never auto-seeds the DB.
 */
@Injectable({ providedIn: 'root' })
export class AcademicYearContextService {
  private readonly yearApi = inject(AcademicYearApiService);

  readonly years = signal<AcademicYearDto[]>([]);
  readonly selectedYearId = signal<number | null>(null);
  readonly loading = signal(false);
  readonly ready = signal(false);

  readonly selectedYear = computed(() => {
    const id = this.selectedYearId();
    if (id == null) return null;
    return this.years().find((y) => y.academicYearId === id) ?? null;
  });

  readonly selectedYearLabel = computed(() => {
    const year = this.selectedYear();
    return year?.name?.trim() || 'Select year';
  });

  /** Emits whenever the selected year id changes (including after first resolve). */
  readonly selectedYearId$ = toObservable(this.selectedYearId);

  private load$?: Observable<AcademicYearDto[]>;

  ensureLoaded(): Observable<AcademicYearDto[]> {
    if (this.ready() && this.years().length) {
      return of(this.years());
    }
    if (!this.load$) {
      this.loading.set(true);
      this.load$ = this.yearApi.search().pipe(
        tap({
          next: (years) => {
            this.years.set(years ?? []);
            this.resolveInitialSelection(years ?? []);
            this.loading.set(false);
            this.ready.set(true);
          },
          error: () => {
            this.years.set([]);
            this.selectedYearId.set(null);
            this.loading.set(false);
            this.ready.set(true);
          }
        }),
        catchError(() => of([] as AcademicYearDto[])),
        shareReplay(1)
      );
    }
    return this.load$;
  }

  selectYear(id: number | null): void {
    if (this.selectedYearId() === id) {
      return;
    }
    this.selectedYearId.set(id);
    this.persist(id);
  }

  /** Prefer CURRENT, then stored id if still valid, then first year.
   *  Respects an id already set (e.g. route query) before load completes. */
  private resolveInitialSelection(years: AcademicYearDto[]): void {
    if (!years.length) {
      this.selectedYearId.set(null);
      return;
    }
    const already = this.selectedYearId();
    if (already != null && years.some((y) => y.academicYearId === already)) {
      this.persist(already);
      return;
    }
    const stored = this.readStoredId();
    const storedMatch = stored != null ? years.find((y) => y.academicYearId === stored) : null;
    const current = years.find((y) => y.status === 'CURRENT') ?? null;
    const pick = storedMatch ?? current ?? years[0];
    this.selectedYearId.set(pick.academicYearId);
    this.persist(pick.academicYearId);
  }

  private persist(id: number | null): void {
    try {
      if (id == null) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, String(id));
      }
    } catch {
      /* private mode / unavailable */
    }
  }

  private readStoredId(): number | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const n = Number(raw);
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  }

  /** Convenience for pages that need a guaranteed id after load. */
  ensureSelectedId(): Observable<number | null> {
    return this.ensureLoaded().pipe(map(() => this.selectedYearId()));
  }
}
