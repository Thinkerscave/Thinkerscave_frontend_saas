import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { GlobalSearchComponent } from './global-search.component';
import { DefaultGlobalSearchProvider, GlobalSearchProvider } from './global-search.provider';

describe('GlobalSearchComponent', () => {
    let component: GlobalSearchComponent;
    let fixture: ComponentFixture<GlobalSearchComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [GlobalSearchComponent],
            providers: [
                { provide: GlobalSearchProvider, useClass: DefaultGlobalSearchProvider },
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

    it('should start hidden', () => {
        expect(component.visible()).toBeFalse();
    });
});
