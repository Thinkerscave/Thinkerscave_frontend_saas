import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { EnrollmentListComponent } from './enrollment-list.component';

describe('EnrollmentListComponent', () => {
    let component: EnrollmentListComponent;
    let fixture: ComponentFixture<EnrollmentListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EnrollmentListComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                provideNoopAnimations()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EnrollmentListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should start with no enrollments loaded', () => {
        expect(component.enrollments()).toEqual([]);
    });
});
