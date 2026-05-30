import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicActivityTimelineComponent } from './activity-timeline.component';

describe('AcademicActivityTimelineComponent', () => {
    let component: AcademicActivityTimelineComponent;
    let fixture: ComponentFixture<AcademicActivityTimelineComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicActivityTimelineComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicActivityTimelineComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});