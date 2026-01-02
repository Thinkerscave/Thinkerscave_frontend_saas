import { Component, Input, OnInit, OnChanges, SimpleChanges, AfterViewChecked, ChangeDetectorRef, ElementRef } from '@angular/core';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { MenuMappingService } from '../../application/services/menu-mapping.service';
import { BreadCrumbService } from '../../services/bread-crumb.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-side-menu',
  imports: [PanelMenuModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent implements OnInit, OnChanges, AfterViewChecked {
  items: MenuItem[] = [];
  @Input() collapsed = false;
  currentRoute: string = '';

  constructor(
    private sideMenuService: MenuMappingService,
    private breadcrumbService: BreadCrumbService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private el: ElementRef
  ) { }

  ngOnInit(): void {
    this.loadMenu();
    this.setupRouteTracking();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['collapsed']) {
      // Wait for view to update, then hide/show text
      setTimeout(() => this.toggleTextVisibility(), 100);
    }
  }

  ngAfterViewChecked(): void {
    // Ensure text visibility is correct
    this.toggleTextVisibility();
    // Update active menu items on every view check
    this.updateActiveMenuItemsInDOM();
  }

  private toggleTextVisibility(): void {
    if (!this.el?.nativeElement) return;
    
    const menuLinks = this.el.nativeElement.querySelectorAll('.p-panelmenu-header-link');
    menuLinks.forEach((link: Element) => {
      const linkElement = link as HTMLElement;
      if (this.collapsed) {
        // Hide all text labels
        const labels = linkElement.querySelectorAll('.p-panelmenu-header-label, span.p-panelmenu-header-label');
        labels.forEach((label) => {
          const labelElement = label as HTMLElement;
          labelElement.style.display = 'none';
          labelElement.style.width = '0';
          labelElement.style.opacity = '0';
          labelElement.style.visibility = 'hidden';
        });
        
        // Hide chevron icons
        const chevrons = linkElement.querySelectorAll('.p-panelmenu-header-icon, i[class*="chevron"]');
        chevrons.forEach((chevron) => {
          const chevronElement = chevron as HTMLElement;
          chevronElement.style.display = 'none';
        });
        
        // Ensure menu icons are visible
        const menuIcons = linkElement.querySelectorAll('i[class*="pi-"]:not([class*="chevron"]):not(.p-panelmenu-header-icon)');
        menuIcons.forEach((icon) => {
          const iconElement = icon as HTMLElement;
          iconElement.style.display = 'inline-block';
          iconElement.style.fontSize = '1.25rem';
          iconElement.style.opacity = '1';
          iconElement.style.visibility = 'visible';
        });
      } else {
        // Restore all labels
        const labels = linkElement.querySelectorAll('.p-panelmenu-header-label, span.p-panelmenu-header-label');
        labels.forEach((label) => {
          const labelElement = label as HTMLElement;
          labelElement.style.display = '';
          labelElement.style.width = '';
          labelElement.style.opacity = '';
          labelElement.style.visibility = '';
        });
      }
    });
  }

  private updateActiveMenuItemsInDOM(): void {
    if (!this.el?.nativeElement) return;
    
    // Remove active classes from all menu items first
    const allLinks = this.el.nativeElement.querySelectorAll('.p-panelmenu-header-link, .p-menuitem-link');
    allLinks.forEach((link: Element) => {
      const linkElement = link as HTMLElement;
      linkElement.classList.remove('active-menu-item', 'active-submenu-item', 'router-link-active');
    });
    
    // Add active classes based on current route
    this.items.forEach(item => {
      if (item.routerLink && this.isRouteActive(item.routerLink, item.queryParams)) {
        // Find the corresponding DOM element
        const menuLinks = this.el.nativeElement.querySelectorAll('.p-panelmenu-header-link');
        menuLinks.forEach((link: Element) => {
          const linkElement = link as HTMLElement;
          const label = linkElement.querySelector('.p-panelmenu-header-label');
          if (label && label.textContent?.trim() === item.label) {
            linkElement.classList.add('active-menu-item', 'router-link-active');
          }
        });
      }
      
      // Check submenu items
      if (item.items) {
        item.items.forEach(subItem => {
          if (subItem.routerLink && this.isRouteActive(subItem.routerLink, subItem.queryParams)) {
            const subLinks = this.el.nativeElement.querySelectorAll('.p-menuitem-link');
            subLinks.forEach((link: Element) => {
              const linkElement = link as HTMLElement;
              const text = linkElement.querySelector('.p-menuitem-text');
              if (text && text.textContent?.trim() === subItem.label) {
                linkElement.classList.add('active-submenu-item', 'router-link-active');
                // Also mark parent as active
                const parentLink = linkElement.closest('.p-panelmenu-panel')?.querySelector('.p-panelmenu-header-link');
                if (parentLink) {
                  (parentLink as HTMLElement).classList.add('parent-active');
                }
              }
            });
          }
        });
      }
    });
  }

  private setupRouteTracking(): void {
    // Track current route for active state
    this.currentRoute = this.router.url;
    
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentRoute = event.url;
        setTimeout(() => {
          this.updateActiveMenuItems();
          this.updateActiveMenuItemsInDOM();
        }, 50);
      });
  }

  private updateActiveMenuItems(): void {
    // Update menu items to reflect active state
    this.items.forEach(item => {
      if (item.routerLink) {
        const isActive = this.isRouteActive(item.routerLink, item.queryParams);
        
        // Clean existing active classes
        let currentStyleClass = (item.styleClass || '').replace(/p-highlight|active-menu-item|router-link-active/g, '').trim();
        
        // Set expanded state if active (for panel menu)
        if (isActive) {
          item.styleClass = (currentStyleClass + ' p-highlight active-menu-item router-link-active').trim();
          item.expanded = true; // Auto-expand active menu
        } else {
          item.styleClass = currentStyleClass;
        }
      }

      // Update submenu items
      if (item.items) {
        item.items.forEach(subItem => {
          if (subItem.routerLink) {
            const isSubActive = this.isRouteActive(subItem.routerLink, subItem.queryParams);
            
            // Clean existing active classes
            let subCurrentStyleClass = (subItem.styleClass || '').replace(/router-link-active|active-submenu-item/g, '').trim();
            
            if (isSubActive) {
              subItem.styleClass = (subCurrentStyleClass + ' router-link-active active-submenu-item').trim();
              // Expand parent if child is active
              if (item.routerLink) {
                item.expanded = true;
                let parentStyleClass = (item.styleClass || '').replace(/parent-active/g, '').trim();
                item.styleClass = (parentStyleClass + ' parent-active').trim();
              }
            } else {
              subItem.styleClass = subCurrentStyleClass;
            }
          }
        });
      }
    });
  }

  private isRouteActive(routerLink: string[] | string | undefined, queryParams?: any): boolean {
    if (!routerLink) return false;
    
    // Handle both array and string formats
    let routePath: string;
    if (Array.isArray(routerLink)) {
      if (routerLink.length === 0) return false;
      routePath = '/' + routerLink.join('/');
    } else {
      // If it's a string, use it directly
      routePath = routerLink.startsWith('/') ? routerLink : '/' + routerLink;
    }
    
    const urlParts = this.currentRoute.split('?');
    const currentPath = urlParts[0];
    
    // Check if paths match
    if (currentPath === routePath || currentPath.startsWith(routePath + '/')) {
      // If query params are specified, check them too
      if (queryParams) {
        const currentQueryParams = new URLSearchParams(urlParts[1] || '');
        return Object.keys(queryParams).every(key => 
          currentQueryParams.get(key) === String(queryParams[key])
        );
      }
      return true;
    }
    
    return false;
  }

  // private loadMenu(): void {
  //   this.sideMenuService.loadMenu().subscribe({
  //     next: (menus) => {
  //       this.items = menus.map((menu: any) => {
  //         const isActive = this.isRouteActive(menu.routerLink, menu.queryParams);
          
  //         // Check if any submenu item is active
  //         let hasActiveSubmenu = false;
  //         if (menu.items) {
  //           hasActiveSubmenu = menu.items.some((sub: any) => 
  //             this.isRouteActive(sub.routerLink, sub.queryParams)
  //           );
  //         }
          
  //         return {
  //           ...menu,
  //           expanded: isActive || hasActiveSubmenu, // Auto-expand if active
  //           styleClass: isActive ? 'p-highlight active-menu-item' : (hasActiveSubmenu ? 'parent-active' : ''),
  //           command: menu.routerLink
  //             ? () => this.breadcrumbService.setBreadcrumb(menu.label, '')
  //             : undefined,
  //           items: menu.items?.map((sub: any) => {
  //             const isSubActive = this.isRouteActive(sub.routerLink, sub.queryParams);
              
  //             return {
  //               ...sub,
  //               styleClass: isSubActive ? 'router-link-active active-submenu-item' : '',
  //               command: () =>
  //                 this.breadcrumbService.setBreadcrumb(menu.label, sub.label)
  //             };
  //           })
  //         };
  //       });
        
  //       // Update active state after menu is loaded
  //       setTimeout(() => {
  //         this.updateActiveMenuItems();
  //         this.updateActiveMenuItemsInDOM();
  //       }, 100);
  //     },
  //     error: (err) => console.error('Error loading menu:', err)
  //   });
  // }

  private loadMenu(): void {
    this.sideMenuService.loadMenu().subscribe({
      next: (menus) => {
        this.items = menus.map((menu: any) => {
          const isActive = this.isRouteActive(menu.routerLink, menu.queryParams);
          
          // Check if any submenu item is active
          let hasActiveSubmenu = false;
          if (menu.items) {
            hasActiveSubmenu = menu.items.some((sub: any) => 
              this.isRouteActive(sub.routerLink, sub.queryParams)
            );
          }
          
          // Special handling for "Manage Menu" - check by label/text
          const isManageMenu = menu.label === 'Manage Menu' || menu.label === 'Manage Menu';
          const manageMenuActive = this.currentRoute.includes('/manage-menu') || 
                                  this.currentRoute.includes('/menu/manage');
          
          return {
            ...menu,
            expanded: isActive || hasActiveSubmenu || (isManageMenu && manageMenuActive),
            styleClass: isActive || (isManageMenu && manageMenuActive) ? 
              'p-highlight active-menu-item router-link-active' : 
              (hasActiveSubmenu ? 'parent-active' : ''),
            command: menu.routerLink
              ? () => this.breadcrumbService.setBreadcrumb(menu.label, '')
              : undefined,
            items: menu.items?.map((sub: any) => {
              const isSubActive = this.isRouteActive(sub.routerLink, sub.queryParams);
              
              // Special styling for active submenu items
              return {
                ...sub,
                styleClass: isSubActive ? 'router-link-active active-submenu-item' : '',
                command: () =>
                  this.breadcrumbService.setBreadcrumb(menu.label, sub.label)
              };
            })
          };
        });
        
        // Update active state after menu is loaded
        setTimeout(() => {
          this.updateActiveMenuItems();
          this.updateActiveMenuItemsInDOM();
        }, 100);
      },
      error: (err) => console.error('Error loading menu:', err)
    });
  }
}
