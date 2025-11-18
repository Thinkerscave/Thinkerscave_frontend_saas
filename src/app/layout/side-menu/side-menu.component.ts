import { Component, Input } from '@angular/core';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { MenuMappingService } from '../../application/services/menu-mapping.service';
import { BreadCrumbService } from '../../services/bread-crumb.service';

@Component({
  selector: 'app-side-menu',
  imports: [PanelMenuModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent {
  items: MenuItem[] = [];
  @Input() collapsed = false;

  constructor(private sideMenuService: MenuMappingService,
    private breadcrumbService: BreadCrumbService
  ) { }

  ngOnInit(): void {
    this.loadMenu();
  }

  private loadMenu(): void {
    this.sideMenuService.loadMenu().subscribe({
      next: (menus) => {
        this.items = menus.map((menu: any) => ({
          ...menu, // keep API response as-is
          command: menu.routerLink
            ? () => this.breadcrumbService.setBreadcrumb(menu.label, '')
            : undefined,
          items: menu.items?.map((sub: any) => ({
            ...sub,
            command: () =>
              this.breadcrumbService.setBreadcrumb(menu.label, sub.label)
          }))
        }));
      },
      error: (err) => console.error('Error loading menu:', err)
    });
  }


}
