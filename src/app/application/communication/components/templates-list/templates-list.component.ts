import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

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

@Component({
  selector: 'app-templates-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DatePipe, RouterLink, SaasPageHeaderComponent, SaasPanelComponent, SaasFilterRowComponent, SaasPillComponent, SaasStatGridComponent],
  templateUrl: './templates-list.component.html',
  styleUrl: './templates-list.component.scss'
})
export class TemplatesListComponent {
  search = '';
  categoryFilter = 'all';
  statusFilter = 'all';

  templates: Template[] = [
    { id: 1, name: 'Fee Reminder', category: 'Billing', subject: 'Fee payment due reminder', active: true, updatedAt: '2024-01-12' },
    { id: 2, name: 'Welcome Parent', category: 'Onboarding', subject: 'Welcome to Thinkerscave', active: true, updatedAt: '2024-01-08' },
    { id: 3, name: 'Attendance Warning', category: 'Attendance', subject: 'Low attendance notice', active: true, updatedAt: '2024-01-05' },
    { id: 4, name: 'PTM Invitation', category: 'Event', subject: 'PTM scheduled this Saturday', active: true, updatedAt: '2024-01-04' },
    { id: 5, name: 'Result Published', category: 'Academic', subject: 'Term result is now available', active: true, updatedAt: '2024-01-03' },
    { id: 6, name: 'Holiday Notice', category: 'Notice', subject: 'School closure', active: false, updatedAt: '2023-12-22' },
    { id: 7, name: 'Birthday Wish', category: 'Engagement', subject: 'Happy birthday from school', active: true, updatedAt: '2023-12-12' },
    { id: 8, name: 'Late Submission', category: 'Academic', subject: 'Assignment overdue', active: false, updatedAt: '2023-12-08' }
  ];

  get stats(): SaasStat[] {
    return [
      { key: 'total', label: 'Total Templates', value: this.templates.length.toString(), helper: 'All categories', icon: 'pi pi-file-edit', tone: 'primary' },
      { key: 'active', label: 'Active', value: this.templates.filter(t => t.active).length.toString(), helper: 'Ready to use', icon: 'pi pi-check-circle', tone: 'success' },
      { key: 'draft', label: 'Draft', value: this.templates.filter(t => !t.active).length.toString(), helper: 'Awaiting publish', icon: 'pi pi-pencil', tone: 'warning' },
      { key: 'cats', label: 'Categories', value: this.categories.length.toString(), helper: 'Unique categories', icon: 'pi pi-tag', tone: 'info' }
    ];
  }

  get categories(): string[] { return Array.from(new Set(this.templates.map(t => t.category))).sort(); }

  get filtered(): Template[] {
    const q = this.search.trim().toLowerCase();
    return this.templates.filter(t => {
      if (this.categoryFilter !== 'all' && t.category !== this.categoryFilter) return false;
      if (this.statusFilter === 'active' && !t.active) return false;
      if (this.statusFilter === 'draft' && t.active) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.subject.toLowerCase().includes(q)) return false;
      return true;
    });
  }
}
