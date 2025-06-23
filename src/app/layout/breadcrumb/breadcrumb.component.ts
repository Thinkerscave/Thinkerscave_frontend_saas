import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { BreadcrumbModule } from 'primeng/breadcrumb';

@Component({
  selector: 'app-breadcrumb',
  imports: [ BreadcrumbModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent {
  @Input() menuLabel: string = '';
  @Input() subMenuLabel: string = '';

  items: MenuItem[] = [];
  home: MenuItem = {};

  constructor(private router: Router) {}

  ngOnInit() {
    this.home = {
      icon: 'pi pi-home',
      routerLink: ['/app'],
      styleClass: 'text-color',
    };

    this.items = [
      { label: this.menuLabel },
      { label: this.subMenuLabel }
    ];
  }
}
