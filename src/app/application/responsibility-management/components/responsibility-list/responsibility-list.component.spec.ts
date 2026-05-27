import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';

import { ResponsibilityListComponent } from './responsibility-list.component';

describe('ResponsibilityListComponent', () => {
    let component: ResponsibilityListComponent;
    let fixture: ComponentFixture<ResponsibilityListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ResponsibilityListComponent],
            providers: [
                MessageService,
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                provideNoopAnimations()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ResponsibilityListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should start with no responsibilities loaded', () => {
        expect(component.responsibilities()).toEqual([]);
    });

    it('should aggregate 0 privileges when list is empty', () => {
        expect(component.totalPrivileges()).toBe(0);
    });
});
