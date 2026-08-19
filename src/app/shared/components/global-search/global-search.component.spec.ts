import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { GlobalSearchComponent } from './global-search.component';
import { DefaultGlobalSearchProvider, GlobalSearchProvider } from './global-search.provider';
import { LoginService } from '../../../core/services/login.service';

describe('GlobalSearchComponent', () => {
    let component: GlobalSearchComponent;
    let fixture: ComponentFixture<GlobalSearchComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GlobalSearchComponent],
            providers: [
                { provide: GlobalSearchProvider, useClass: DefaultGlobalSearchProvider },
                {
                  provide: LoginService,
                  useValue: {
                    getUser: () => ({ roles: [{ roleType: 'ORGANIZATION_ADMIN' }] }),
                    getLoginContext: () => 'TENANT'
                  }
                },
                provideRouter([]),
                provideNoopAnimations()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(GlobalSearchComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should start with the results panel closed', () => {
        expect(component.open()).toBeFalse();
    });
});
