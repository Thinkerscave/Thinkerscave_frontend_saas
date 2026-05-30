import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicProgressRingComponent } from './progress-ring.component';

describe('AcademicProgressRingComponent', () => {
    let component: AcademicProgressRingComponent;
    let fixture: ComponentFixture<AcademicProgressRingComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicProgressRingComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicProgressRingComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});