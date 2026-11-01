import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { MenuMappingService } from '../../application/services/menu-mapping.service';
import { BackNavigationService } from '../../core/services/back-navigation.service';
import { LoginService } from '../../core/services/login.service';
import { NavigationHistoryService } from '../../core/services/navigation-history.service';
import { PageMetaService, ResolvedPageMeta } from '../../core/services/page-meta.service';
import { SaasPageHeaderComponent } from '../../shared/ui/saas/saas-page-header.component';

import { BreadcrumbComponent } from './breadcrumb.component';

@Component({
  standalone: true,
  imports: [BreadcrumbComponent, SaasPageHeaderComponent],
  template: `
    <app-breadcrumb></app-breadcrumb>
    <tc-saas-page-header [shellActions]="true">
      <button class="tc-btn tc-btn--primary" (click)="saved = true">Save</button>
      <button aria-label="More actions">...</button>
    </tc-saas-page-header>
  `
})
class HeaderTestPage {
  saved = false;
}

describe('BreadcrumbComponent', () => {
  let fixture: ComponentFixture<HeaderTestPage>;
  let meta: ResolvedPageMeta;
  let back: jasmine.Spy;

  function header(): HTMLElement {
    return fixture.nativeElement.querySelector('.tc-page-header');
  }

  beforeEach(async () => {
    meta = {
      title: 'Subject Details',
      subtitle: null,
      crumbs: [{ label: 'Subjects', link: ['/app/academics/subjects'] }],
      pageKind: 'detail',
      showBack: true,
      hideBack: false,
      backFallback: '/app/academics/subjects',
      hideBreadcrumb: false,
      rightLabel: null
    };
    back = jasmine.createSpy('back');
    await TestBed.configureTestingModule({
      imports: [HeaderTestPage],
      providers: [
        provideRouter([]),
        { provide: MenuMappingService, useValue: { loadMenu: () => of([]) } },
        { provide: LoginService, useValue: { getUser: () => null, getLoginContext: () => 'ORGANIZATION' } },
        { provide: NavigationHistoryService, useValue: { hasPrevious: () => false } },
        { provide: PageMetaService, useValue: { resolve: () => meta } },
        { provide: BackNavigationService, useValue: { back } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderTestPage);
    fixture.detectChanges();
    fixture.detectChanges();
  });

  it('renders breadcrumbs before the action row', () => {
    const right = header().querySelector('.tc-page-header__right')!;
    expect(right.children[0].classList.contains('tc-page-header__trail-wrap')).toBeTrue();
    expect(right.children[1].classList.contains('tc-page-header__actions')).toBeTrue();
  });

  it('places Back immediately before the primary action and keeps overflow last', () => {
    const buttons = header().querySelectorAll('button');
    expect(buttons[0].textContent).toContain('Back');
    expect(buttons[1].textContent).toContain('Save');
    expect(buttons[2].getAttribute('aria-label')).toBe('More actions');
    expect(fixture.nativeElement.querySelector('tc-saas-page-header button')).toBeNull();
  });

  it('preserves projected action handlers and Back navigation', () => {
    const buttons = header().querySelectorAll('button');
    buttons[0].click();
    buttons[1].click();
    expect(back).toHaveBeenCalledOnceWith({ fallback: '/app/academics/subjects' });
    expect(fixture.componentInstance.saved).toBeTrue();
  });

  it('omits Back when the page does not require it', () => {
    fixture.destroy();
    meta = { ...meta, pageKind: 'main', hideBack: true, showBack: false };
    fixture = TestBed.createComponent(HeaderTestPage);
    fixture.detectChanges();
    fixture.detectChanges();
    expect(header().querySelector('.tc-btn--back')).toBeNull();
    expect(header().querySelector('.tc-btn--primary')).not.toBeNull();
  });
});
