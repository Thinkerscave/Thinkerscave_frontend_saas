import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import {
  SaasPageHeaderComponent,
  SaasPanelComponent,
  SaasFilterRowComponent,
  SaasPillComponent,
  SaasStatGridComponent,
  SaasStat
} from '../../../../shared/ui/saas';

interface Template {
  id: number;
  name: string;
  category: string;
  subject: string;
  active: boolean;
  updatedAt: string;
}

interface SelectOption {
  label: string;
  value: string;
}

const STORAGE_KEY = 'tc.communication.templates';

@Component({
  selector: 'app-templates-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink, DropdownModule, SaasPageHeaderComponent, SaasPanelComponent, SaasFilterRowComponent, SaasPillComponent, SaasStatGridComponent],
  templateUrl: './templates-list.component.html',
  styleUrl: './templates-list.component.scss'
})
export class TemplatesListComponent implements OnInit {
  search = '';
  categoryFilter = 'all';
  statusFilter = 'all';
  templates: Template[] = [];

  readonly statusOptions: SelectOption[] = [
    { label: 'All', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Draft', value: 'draft' }
  ];

  ngOnInit(): void {
    this.templates = this.readStored();
  }

  get stats(): SaasStat[] {
    const total = this.templates.length;
    const active = this.templates.filter(t => t.active).length;
    return [
      { key: 'total', label: 'Templates', value: String(total), helper: 'Saved locally', icon: 'pi pi-file-edit', tone: 'primary' },
      { key: 'active', label: 'Active', value: String(active), helper: 'Ready to use', icon: 'pi pi-check', tone: 'success' }
    ];
  }

  get categories(): string[] {
    return Array.from(new Set(this.templates.map(t => t.category))).sort();
  }

  get categoryOptions(): SelectOption[] {
    return [
      { label: 'All', value: 'all' },
      ...this.categories.map(c => ({ label: c, value: c }))
    ];
  }

  get filtered(): Template[] {
    const q = this.search.trim().toLowerCase();
    return this.templates.filter(t => {
      if (this.categoryFilter !== 'all' && t.category !== this.categoryFilter) return false;
      if (this.statusFilter === 'active' && !t.active) return false;
      if (this.statusFilter === 'draft' && t.active) return false;
      if (this.statusFilter === 'inactive' && t.active) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) return false;
      return true;
    });
  }

  private readStored(): Template[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) as Template[] : [];
    } catch {
      return [];
    }
  }
}
