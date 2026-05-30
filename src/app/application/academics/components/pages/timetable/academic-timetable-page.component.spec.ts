import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicTimetablePageComponent } from './academic-timetable-page.component';

describe('AcademicTimetablePageComponent', () => {
    let component: AcademicTimetablePageComponent;
    let fixture: ComponentFixture<AcademicTimetablePageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicTimetablePageComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicTimetablePageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});