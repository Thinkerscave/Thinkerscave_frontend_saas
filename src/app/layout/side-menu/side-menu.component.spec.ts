import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { of } from 'rxjs';
import { MenuMappingService } from '../../application/services/menu-mapping.service';
import { BreadCrumbService } from '../../core/services/bread-crumb.service';
import { PermissionService } from '../../core/services/permission.service';
import { SidebarLayoutService } from '../../core/services/sidebar-layout.service';
import { SideMenuComponent } from './side-menu.component';

describe('SideMenuComponent', () => {
  let component: SideMenuComponent;
  let fixture: ComponentFixture<SideMenuComponent>;
  let router: Router;
  let sidebarLayout: SidebarLayoutService;

  const subscriptionsGroup: MenuItem = {
    id: '23',
    title: 'SUBSCRIPTIONS_GROUP',
    label: 'Subscriptions',
    icon: 'pi pi-credit-card',
    items: [
      {
        id: '17',
        title: 'SUBSCRIPTION_PLANS',
        label: 'Subscription Plans',
        icon: 'pi pi-credit-card',
        routerLink: '/app/tenant-management/subscription-plans'
      },
      {
        id: '18',
        title: 'PROMOTIONS',
        label: 'Promotions',
        icon: 'pi pi-local-offer',
        routerLink: '/app/tenant-management/promotions'
      }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SideMenuComponent],
      providers: [
        provideRouter([]),
        {
          provide: MenuMappingService,
          useValue: {
            loadMenu: () => of([subscriptionsGroup])
          }
        },
        {
          provide: PermissionService,
          useValue: {
            loadPermissions: () => of(void 0)
          }
        },
        BreadCrumbService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SideMenuComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    sidebarLayout = TestBed.inject(SidebarLayoutService);
    sidebarLayout.setHovered(true);
    fixture.detectChanges();
  });

  it('should create and load grouped menus', () => {
    expect(component).toBeTruthy();
    expect(component.items.length).toBe(1);
    expect(component.items[0].items?.length).toBe(2);
  });

  it('should resolve navigable url for subscription plans child', () => {
    const child = subscriptionsGroup.items![0];
    expect(component.resolveNavigableUrl(child)).toBe('/app/tenant-management/subscription-plans');
  });

  it('should resolve navigable url for promotions child', () => {
    const child = subscriptionsGroup.items![1];
    expect(component.resolveNavigableUrl(child)).toBe('/app/tenant-management/promotions');
  });

  it('should navigate when selectItem is invoked on a submenu leaf', async () => {
    const navigateSpy = spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    const parent = subscriptionsGroup;
    const child = subscriptionsGroup.items![0];

    component.toggleGroup(parent);
    component.selectItem(parent, child);

    expect(navigateSpy).toHaveBeenCalledWith('/app/tenant-management/subscription-plans');
  });

  it('should not resolve url when routerLink is missing', () => {
    const childWithoutRoute: MenuItem = {
      id: '17',
      title: 'SUBSCRIPTION_PLANS',
      label: 'Subscription Plans'
    };
    expect(component.resolveNavigableUrl(childWithoutRoute)).toBeNull();
  });

  it('should preserve manually opened groups when sidebar is re-entered', () => {
    component.toggleGroup(subscriptionsGroup);
    expect(component.isGroupOpen(subscriptionsGroup)).toBeTrue();

    component.onSidebarEnter();
    expect(component.isGroupOpen(subscriptionsGroup)).toBeTrue();
  });

  it('should collapse on sidebar leave even when a group is open', fakeAsync(() => {
    component.toggleGroup(subscriptionsGroup);
    expect(component.isGroupOpen(subscriptionsGroup)).toBeTrue();

    component.onSidebarLeave();
    tick(300);

    expect(component.isGroupOpen(subscriptionsGroup)).toBeFalse();
    expect(component.displayExpanded).toBeFalse();
  }));
});
