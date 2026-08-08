import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';

import {
  SaasPageHeaderComponent,
  SaasPanelComponent
} from '../../../../shared/ui/saas';

interface TemplateVariable { key: string; description: string; }

@Component({
  selector: 'app-template-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, DropdownModule, SaasPageHeaderComponent, SaasPanelComponent],
  templateUrl: './template-editor.component.html',
  styleUrl: './template-editor.component.scss'
})
export class TemplateEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  isNew = true;
  template = {
    name: '',
    category: 'Notice',
    subject: '',
    body: '',
    active: true
  };

  readonly bodyPlaceholder = 'Hello {{parent_name}},\nYour child {{student_name}} ...';

  variables: TemplateVariable[] = [
    { key: '{{student_name}}', description: 'Student full name' },
    { key: '{{parent_name}}', description: 'Parent / guardian name' },
    { key: '{{class}}', description: 'Class & section' },
    { key: '{{date}}', description: 'Current date' },
    { key: '{{school_name}}', description: 'Organization name' },
    { key: '{{amount}}', description: 'Fee / payment amount' },
    { key: '{{due_date}}', description: 'Due date for action' }
  ];

  categories = ['Notice', 'Billing', 'Attendance', 'Academic', 'Event', 'Onboarding', 'Engagement'];
  readonly categoryOptions = this.categories.map(c => ({ label: c, value: c }));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isNew = id === 'new' || !id;
  }

  insertVariable(v: string): void {
    this.template.body = (this.template.body || '') + ' ' + v;
  }

  save(): void {
    // TODO: wire to a real templates endpoint when available
    this.router.navigate(['/app/communication/templates']);
  }

  cancel(): void {
    this.router.navigate(['/app/communication/templates']);
  }
}
