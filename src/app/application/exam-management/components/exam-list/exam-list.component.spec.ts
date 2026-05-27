import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ExamListComponent } from './exam-list.component';

describe('ExamListComponent', () => {
    let component: ExamListComponent;
    let fixture: ComponentFixture<ExamListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ExamListComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                provideNoopAnimations()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ExamListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should initialise with an empty exam list', () => {
        expect(component.exams()).toEqual([]);
    });
});
