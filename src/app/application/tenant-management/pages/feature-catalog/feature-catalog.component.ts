import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { PlatformFeature } from '../../models/platform.model';
import { PlatformManagementService } from '../../services/platform-management.service';
import {
  SaasFilterRowComponent,
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'tc-feature-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    SaasPageHeaderComponent,
    SaasStatGridComponent,
    SaasPanelComponent,
    SaasPillComponent,
    SaasFilterRowComponent
  ],
  templateUrl: './feature-catalog.component.html',
  styleUrl: './feature-catalog.component.scss'
})
export class FeatureCatalogComponent implements OnInit {
  private readonly api = inject(PlatformManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  errorMessage = '';
  readonly search = signal('');
  readonly categoryFilter = signal('all');
  readonly viewMode = signal<'grouped' | 'table'>('grouped');
  readonly modules = signal<PlatformFeature[]>([]);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getFeatures().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: list => {
        this.modules.set(list.filter(f => f.active !== false));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = 'Unable to load feature catalog from platform API.';
        this.modules.set([]);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  readonly categories = computed(() => {
    const cats = new Set(this.modules().map(m => m.category || m.module || 'General'));
    return ['all', ...Array.from(cats).sort()];
  });

  readonly stats = computed<SaasStat[]>(() => {
    const list = this.modules();
    const premium = list.filter(m => m.premiumFeature).length;
    return [
      { key: 'total', label: 'Total Features', value: list.length, helper: 'Catalogue items', icon: 'pi pi-th-large', tone: 'primary' },
      { key: 'premium', label: 'Premium Features', value: premium, helper: 'Paid add-ons', icon: 'pi pi-star', tone: 'warning' },
      { key: 'enabled', label: 'Default Enabled', value: list.filter(m => m.defaultEnabled).length, helper: 'On by default', icon: 'pi pi-check', tone: 'success' },
      { key: 'modules', label: 'Modules', value: new Set(list.map(m => m.module).filter(Boolean)).size, helper: 'Distinct modules', icon: 'pi pi-box', tone: 'info' }
    ];
  });

  readonly filtered = computed<PlatformFeature[]>(() => {
    const q = this.search().trim().toLowerCase();
    const cat = this.categoryFilter();
    return this.modules().filter(m => {
      const category = m.category || m.module || 'General';
      if (cat !== 'all' && category !== cat) return false;
      if (!q) return true;
      return (m.featureName?.toLowerCase().includes(q) || m.featureCode?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q));
    });
  });

  readonly groupedFeatures = computed<{ module: string; features: PlatformFeature[] }[]>(() => {
    const list = this.filtered();
    const map = new Map<string, PlatformFeature[]>();
    for (const f of list) {
      const mod = f.module || 'General';
      if (!map.has(mod)) map.set(mod, []);
      map.get(mod)!.push(f);
    }
    return Array.from(map.entries())
      .map(([module, features]) => ({ module, features }))
      .sort((a, b) => a.module.localeCompare(b.module));
  });

  pillTone(feature: PlatformFeature): 'success' | 'warning' | 'neutral' {
    if (feature.premiumFeature) return 'warning';
    if (feature.defaultEnabled) return 'success';
    return 'neutral';
  }

  reset(): void {
    this.search.set('');
    this.categoryFilter.set('all');
  }
}
