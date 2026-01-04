import { Component, Input, OnInit, OnChanges, SimpleChanges, AfterViewChecked, ChangeDetectorRef, ElementRef, ViewChild, HostListener } from '@angular/core';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { MenuMappingService } from '../../application/services/menu-mapping.service';
import { BreadCrumbService } from '../../services/bread-crumb.service';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-side-menu',
  imports: [CommonModule, PanelMenuModule],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent implements OnInit, OnChanges, AfterViewChecked {
  items: MenuItem[] = [];
  @Input() collapsed = false;
  currentRoute: string = '';
  @ViewChild('scrollContainer', { static: false }) scrollContainer?: ElementRef;
  
  // Scroll state
  isScrolled = false;
  isAtBottom = false;
  isAtTop = true;

  constructor(
    private sideMenuService: MenuMappingService,
    private breadcrumbService: BreadCrumbService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private el: ElementRef
  ) { }

  ngOnInit(): void {
    this.loadMenu();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.currentRoute = this.router.url;
        this.updateActiveMenuItems();
        
        // Auto-scroll to active menu item after navigation
        setTimeout(() => this.scrollToActiveItem(), 100);
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['collapsed']) {
      // Wait for view to update, then hide/show text
      setTimeout(() => {
        this.toggleTextVisibility();
        // Reset scroll position when collapsing/expanding
        this.resetScroll();
      }, 100);
    }
  }

  ngAfterViewChecked(): void {
    // Check scroll position after view updates
    this.checkScrollPosition();
  }

  @HostListener('window:resize')
  onResize() {
    this.checkScrollPosition();
  }

  private resetScroll(): void {
    if (this.scrollContainer?.nativeElement) {
      this.scrollContainer.nativeElement.scrollTop = 0;
      this.isAtTop = true;
      this.isAtBottom = false;
      this.isScrolled = false;
    }
  }

  private checkScrollPosition(): void {
    if (!this.scrollContainer?.nativeElement) return;
    
    const element = this.scrollContainer.nativeElement;
    const scrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    // Update scroll state
    this.isScrolled = scrollTop > 0;
    this.isAtTop = scrollTop === 0;
    this.isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1;
    
    // Update CSS classes for shadow effects
    if (element.classList) {
      element.classList.toggle('scrolled-top', !this.isAtTop);
      element.classList.toggle('scrolled-bottom', !this.isAtBottom);
    }
    
    this.cdr.detectChanges();
  }

  onScroll(event: Event): void {
    this.checkScrollPosition();
  }

  private scrollToActiveItem(): void {
    if (!this.scrollContainer?.nativeElement) return;
    
    const container = this.scrollContainer.nativeElement;
    const activeItem = container.querySelector('.p-highlight, .active-menu-item, .router-link-active');
    
    if (activeItem) {
      const containerRect = container.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();
      
      // Calculate scroll position to center the active item
      const scrollTop = itemRect.top - containerRect.top + container.scrollTop - (containerRect.height / 2) + (itemRect.height / 2);
      
      // Smooth scroll to position
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }
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

  private updateActiveMenuItems(): void {
    this.items.forEach(menu => {
      let parentActive = false;

      // MAIN MENU
      if (menu.routerLink && this.isRouteActive(menu.routerLink)) {
        menu.styleClass = 'p-highlight active-menu-item';
        menu.expanded = true;
        parentActive = true;
      } else {
        menu.styleClass = '';
      }

      // SUB MENU
      if (menu.items) {
        menu.items.forEach(sub => {
          if (sub.routerLink && this.isRouteActive(sub.routerLink)) {
            sub.styleClass = 'router-link-active active-submenu-item';
            parentActive = true;
            menu.expanded = true;
          } else {
            sub.styleClass = '';
          }
        });
      }

      // PARENT ACTIVE (when child selected)
      if (parentActive && !menu.styleClass?.includes('p-highlight')) {
        menu.styleClass = 'parent-active';
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
        
        // After menu loads, check scroll position
        setTimeout(() => {
          this.checkScrollPosition();
          this.scrollToActiveItem();
        }, 200);
      },
      error: (err) => console.error('Error loading menu:', err)
    });
  }
}