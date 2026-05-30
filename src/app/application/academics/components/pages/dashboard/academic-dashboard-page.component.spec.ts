import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicDashboardPageComponent } from './academic-dashboard-page.component';

describe('AcademicDashboardPageComponent', () => {
    let component: AcademicDashboardPageComponent;
    let fixture: ComponentFixture<AcademicDashboardPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicDashboardPageComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicDashboardPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});