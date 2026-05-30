import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicMetricCardComponent } from './metric-card.component';

describe('AcademicMetricCardComponent', () => {
    let component: AcademicMetricCardComponent;
    let fixture: ComponentFixture<AcademicMetricCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicMetricCardComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicMetricCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});