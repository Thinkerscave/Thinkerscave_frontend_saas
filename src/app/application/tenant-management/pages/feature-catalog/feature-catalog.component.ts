import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SaasFilterRowComponent,
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasPillComponent,
  SaasStat,
  SaasStatGridComponent
} from '../../../../shared/ui/saas';

interface FeatureModule {
  code: string;
  name: string;
  category: 'Core' | 'Premium' | 'Add-on';
  description: string;
  plans: string[];
  status: 'Active' | 'Beta' | 'Deprecated';
  tenants: number;
}

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
export class FeatureCatalogComponent {
  readonly search = signal('');
  readonly categoryFilter = signal<'all' | FeatureModule['category']>('all');
  readonly statusFilter = signal<'all' | FeatureModule['status']>('all');

  readonly modules = signal<FeatureModule[]>([
    { code: 'MOD_STUDENT', name: 'Student Management', category: 'Core', description: '360° student records, parents, alumni and movement', plans: ['Starter', 'Growth', 'Enterprise'], status: 'Active', tenants: 248 },
    { code: 'MOD_STAFF', name: 'Staff & HR', category: 'Core', description: 'Directory, responsibilities, leave and documents', plans: ['Starter', 'Growth', 'Enterprise'], status: 'Active', tenants: 232 },
    { code: 'MOD_ACADEMICS', name: 'Academics', category: 'Core', description: 'Setup, timetable, teacher allocation, syllabus tracker', plans: ['Starter', 'Growth', 'Enterprise'], status: 'Active', tenants: 226 },
    { code: 'MOD_ATTENDANCE', name: 'Attendance', category: 'Core', description: 'Student & staff attendance with calendar and reports', plans: ['Starter', 'Growth', 'Enterprise'], status: 'Active', tenants: 218 },
    { code: 'MOD_ADMISSIONS', name: 'Admissions', category: 'Core', description: 'Inquiry centre, admission centre and conversion wizard', plans: ['Starter', 'Growth', 'Enterprise'], status: 'Active', tenants: 198 },
    { code: 'MOD_FEES', name: 'Fee Management', category: 'Premium', description: 'Structures, invoices, collections and reconciliation', plans: ['Growth', 'Enterprise'], status: 'Active', tenants: 164 },
    { code: 'MOD_EXAMS', name: 'Examinations', category: 'Premium', description: 'Term/unit exams, grade book and report cards', plans: ['Growth', 'Enterprise'], status: 'Active', tenants: 142 },
    { code: 'MOD_COMMS', name: 'Communication', category: 'Premium', description: 'Announcements, conversations, templates and delivery logs', plans: ['Growth', 'Enterprise'], status: 'Active', tenants: 188 },
    { code: 'MOD_TRANSPORT', name: 'Transport', category: 'Add-on', description: 'Routes, vehicles, drivers and live tracking', plans: ['Enterprise'], status: 'Beta', tenants: 36 },
    { code: 'MOD_HOSTEL', name: 'Hostel', category: 'Add-on', description: 'Rooms, allocations and warden tools', plans: ['Enterprise'], status: 'Beta', tenants: 22 },
    { code: 'MOD_LIBRARY', name: 'Library', category: 'Add-on', description: 'Catalogue, issuance, fines and reservations', plans: ['Enterprise'], status: 'Beta', tenants: 18 }
  ]);

  readonly stats = computed<SaasStat[]>(() => {
    const list = this.modules();
    return [
      { key: 'total', label: 'Total Modules', value: list.length, helper: 'Catalogue items', icon: 'pi pi-th-large', tone: 'primary' },
      { key: 'core', label: 'Core Modules', value: list.filter(m => m.category === 'Core').length, helper: 'Bundled with every plan', icon: 'pi pi-box', tone: 'info' },
      { key: 'premium', label: 'Premium Modules', value: list.filter(m => m.category === 'Premium').length, helper: 'Growth & Enterprise', icon: 'pi pi-star', tone: 'warning' },
      { key: 'addon', label: 'Add-ons', value: list.filter(m => m.category === 'Add-on').length, helper: 'Optional entitlements', icon: 'pi pi-plus-circle', tone: 'success' }
    ];
  });

  readonly filtered = computed<FeatureModule[]>(() => {
    const q = this.search().trim().toLowerCase();
    const cat = this.categoryFilter();
    const status = this.statusFilter();
    return this.modules().filter(m =>
      (cat === 'all' || m.category === cat) &&
      (status === 'all' || m.status === status) &&
      (!q || m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q) || m.description.toLowerCase().includes(q))
    );
  });

  pillTone(s: FeatureModule['status']): 'success' | 'warning' | 'danger' {
    return s === 'Active' ? 'success' : s === 'Beta' ? 'warning' : 'danger';
  }

  categoryTone(c: FeatureModule['category']): 'info' | 'warning' | 'success' {
    return c === 'Core' ? 'info' : c === 'Premium' ? 'warning' : 'success';
  }

  reset(): void {
    this.search.set('');
    this.categoryFilter.set('all');
    this.statusFilter.set('all');
  }
}
