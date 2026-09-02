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

  it('should inject Access Management for organization admins even without backend menus', () => {
    const result = (service as any).ensureAccessManagementWorkspace([
      { label: 'Staff', icon: 'pi pi-id-card', routerLink: '/app/staff', items: [
        { label: 'Directory', routerLink: '/app/staff/directory' },
        { label: 'Responsibilities', routerLink: '/app/staff/responsibilities' }
      ] }
    ]) as MenuItem[];

    const access = result.find(item => item.label === 'Access Management');
    const staff = result.find(item => item.label === 'Staff');
    expect(access?.items?.map(child => child.routerLink)).toEqual([
      '/app/access-management/users',
      '/app/access-management/responsibilities',
      '/app/access-management/feature-catalog',
      '/app/access-management/login-history',
      '/app/access-management/security-policy'
    ]);
    expect(staff?.items?.some(child => String(child.routerLink).includes('responsibilities'))).toBeFalse();
    expect(result.some(item => item.label === 'Access Management')).toBeTrue();
  });
});
