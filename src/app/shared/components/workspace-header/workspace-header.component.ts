import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, TemplateRef } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { ButtonModule } from 'primeng/button';

/**
 * Premium workspace header rendered at the top of every module page.
 *
 * Provides:
 *  - title, optional subtitle/description
 *  - breadcrumb trail (PrimeNG MenuItem[])
 *  - tag chips (status, version, environment)
 *  - actions slot via <ng-content select="[actions]">
 *  - filters slot via <ng-content select="[filters]"> rendered on a second row
 */
@Component({
  selector: 'app-workspace-header',
  standalone: true,
  imports: [CommonModule, BreadcrumbModule, ButtonModule],
  templateUrl: './workspace-header.component.html',
  styleUrls: ['./workspace-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WorkspaceHeaderComponent {
  @Input() title = '';
  @Input() subtitle: string | null = null;
  @Input() description: string | null = null;
  @Input() icon: string | null = null;
  @Input() breadcrumbs: MenuItem[] = [];
  @Input() home: MenuItem | undefined = { icon: 'pi pi-home', routerLink: '/' };
  @Input() tags: { label: string; tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' }[] = [];
  @Input() actionsTemplate: TemplateRef<unknown> | null = null;
  @Input() sticky = false;
}
