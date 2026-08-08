import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { PageShellComponent } from '../../shared/ui/page-shell/page-shell.component';
import { SidebarLayoutService } from '../../core/services/sidebar-layout.service';
import { PwaBannersComponent } from '../../shared/components/pwa-banners/pwa-banners.component';
import { DrawerFormComponent } from '../../shared/ui/drawer-form/drawer-form.component';
import { GlobalSettingsComponent } from '../../application/global-settings/global-settings.component';
import { SettingsUiService } from '../../core/services/settings-ui.service';
import { LanguageService } from '../../core/services/language.service';
import { TcTranslatePipe } from '../../shared/pipes/tc-translate.pipe';

@Component({
  selector: 'app-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterOutlet,
    TopBarComponent,
    SideMenuComponent,
    FooterComponent,
    BreadcrumbComponent,
    PageShellComponent,
    PwaBannersComponent,
    DrawerFormComponent,
    GlobalSettingsComponent,
    TcTranslatePipe
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent {
  readonly sidebarLayout = inject(SidebarLayoutService);
  readonly settingsUi = inject(SettingsUiService);
  private readonly language = inject(LanguageService);

  /** Keep title reactive to language changes. */
  settingsTitle(): string {
    this.language.language();
    this.language.catalogVersion();
    return this.language.t('settings.title');
  }

  settingsDescription(): string {
    this.language.language();
    this.language.catalogVersion();
    return this.language.t('settings.drawerHint');
  }
}
