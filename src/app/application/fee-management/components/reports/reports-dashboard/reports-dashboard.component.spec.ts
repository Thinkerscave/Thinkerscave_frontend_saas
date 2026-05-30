import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportsDashboardComponent } from './reports-dashboard.component';
import { provideRouter } from '@angular/router';

describe('ReportsDashboardComponent', () => {
    let component: ReportsDashboardComponent;
    let fixture: ComponentFixture<ReportsDashboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReportsDashboardComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ReportsDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});