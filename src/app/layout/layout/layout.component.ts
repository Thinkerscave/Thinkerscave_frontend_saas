import { Component , ChangeDetectionStrategy} from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { PageShellComponent } from '../../shared/ui/page-shell/page-shell.component';
import { WorkspaceTabsComponent } from '../workspace-tabs/workspace-tabs.component';

@Component({
  selector: 'app-layout',
    changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterOutlet, TopBarComponent, SideMenuComponent, FooterComponent, BreadcrumbComponent, PageShellComponent, WorkspaceTabsComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
}
