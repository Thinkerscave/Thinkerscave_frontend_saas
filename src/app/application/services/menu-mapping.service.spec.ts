import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MenuItem } from 'primeng/api';
import { MenuMappingService } from './menu-mapping.service';
import { OrganizationContextService } from '../../core/services/organization-context.service';

describe('MenuMappingService', () => {
  let service: MenuMappingService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MenuMappingService,
        provideHttpClient(),
        provideHttpClientTesting(),
        OrganizationContextService
      ]
    });
    service = TestBed.inject(MenuMappingService);
  });

  it('should flatten grouped platform menus while keeping child routes', () => {
    const grouped: MenuItem[] = [{
      id: '23',
      title: 'SUBSCRIPTIONS_GROUP',
      label: 'Subscriptions',
      items: [
        {
          id: '17',
          title: 'SUBSCRIPTION_PLANS',
          label: 'Subscription Plans',
          routerLink: '/app/tenant-management/subscription-plans'
        },
        {
          id: '18',
          title: 'PROMOTIONS',
          label: 'Promotions',
          routerLink: '/app/tenant-management/promotions'
        }
      ]
    }];

    const flattened = (service as any).flattenGroupedMenus(grouped) as MenuItem[];
    expect(flattened[0].items?.length).toBe(2);
    expect(flattened[0].items?.[0].routerLink).toBe('/app/tenant-management/subscription-plans');
    expect(flattened[0].items?.[1].routerLink).toBe('/app/tenant-management/promotions');
  });
});
