import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { BreadCrumbService } from '../../services/bread-crumb.service';

@Component({
  selector: 'app-breadcrumb',
  imports: [ BreadcrumbModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {
  items: MenuItem[] = [];
  home: MenuItem = {};

  constructor(
    private router: Router,
    private breadcrumbService: BreadCrumbService
  ) {}

  ngOnInit() {
    this.home = {
      icon: 'pi pi-home',
      routerLink: ['/app'],
      styleClass: 'text-color',
    };

    this.breadcrumbService.breadcrumb$.subscribe(breadcrumb => {
      if (breadcrumb) {
        this.items = [
          { label: breadcrumb.menu },
          { label: breadcrumb.subMenu }
        ];
      } else {
        this.items = [];
      }
    });
  }
}
