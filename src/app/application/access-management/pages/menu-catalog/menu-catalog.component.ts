import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { finalize } from 'rxjs';

import { AccessMenu } from '../../models/access.model';
import { AccessManagementService } from '../../services/access-management.service';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

@Component({
  selector: 'app-menu-catalog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, FormsModule, RouterLink, ToastModule,
    SaasPageHeaderComponent, SaasStatGridComponent, SaasPanelComponent, SaasPillComponent
  ],
  providers: [MessageService],
  templateUrl: './menu-catalog.component.html',
  styleUrl: './menu-catalog.component.scss'
})
export class MenuCatalogComponent implements OnInit {
  private readonly api = inject(AccessManagementService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly messages = inject(MessageService);

  loading = true;
  errorMessage = '';
  search = '';
  menus: AccessMenu[] = [];
  flatMenus: AccessMenu[] = [];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.api.getMenuTree().pipe(
      finalize(() => { this.loading = false; this.cdr.markForCheck(); }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: menus => {
        this.menus = menus ?? [];
        this.flatMenus = this.flatten(menus);
      },
      error: () => {
        this.menus = [];
        this.flatMenus = [];
        this.errorMessage = 'Could not load menu catalog.';
      }
    });
  }

  get stats(): SaasStat[] {
    const pages = this.flatMenus.filter(m => m.menuType === 'PAGE').length;
    const modules = this.flatMenus.filter(m => m.menuType === 'MODULE').length;
    const active = this.flatMenus.filter(m => m.active !== false).length;
    return [
      { key: 'total', label: 'Total Items', value: this.flatMenus.length, icon: 'pi pi-th-large', tone: 'primary' },
      { key: 'modules', label: 'Modules', value: modules, icon: 'pi pi-folder', tone: 'info' },
      { key: 'pages', label: 'Pages', value: pages, icon: 'pi pi-file', tone: 'success' },
      { key: 'active', label: 'Active', value: active, icon: 'pi pi-check', tone: 'neutral' }
    ];
  }

  get filtered(): AccessMenu[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.flatMenus;
    return this.flatMenus.filter(m =>
      m.menuName.toLowerCase().includes(q) || (m.menuCode ?? '').toLowerCase().includes(q) || (m.route ?? '').toLowerCase().includes(q)
    );
  }

  toggleMenu(menu: AccessMenu): void {
    const action = menu.active === false ? this.api.activateMenu(menu.id) : this.api.deactivateMenu(menu.id);
    action.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.messages.add({ severity: 'success', summary: 'Updated', detail: `${menu.menuName} status changed.` });
        this.load();
      },
      error: () => this.messages.add({ severity: 'error', summary: 'Failed', detail: 'Could not update menu.' })
    });
  }

  trackById(_: number, m: AccessMenu): number { return m.id; }

  private flatten(items: AccessMenu[]): AccessMenu[] {
    const out: AccessMenu[] = [];
    const walk = (list: AccessMenu[]) => {
      for (const item of list ?? []) {
        out.push(item);
        if (item.children?.length) walk(item.children);
      }
    };
    walk(items);
    return out;
  }
}
