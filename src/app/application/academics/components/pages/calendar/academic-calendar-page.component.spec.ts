import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicCalendarPageComponent } from './academic-calendar-page.component';

describe('AcademicCalendarPageComponent', () => {
    let component: AcademicCalendarPageComponent;
    let fixture: ComponentFixture<AcademicCalendarPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicCalendarPageComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicCalendarPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});