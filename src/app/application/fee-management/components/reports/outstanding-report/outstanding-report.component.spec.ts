import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OutstandingReportComponent } from './outstanding-report.component';
import { provideRouter } from '@angular/router';

describe('OutstandingReportComponent', () => {
    let component: OutstandingReportComponent;
    let fixture: ComponentFixture<OutstandingReportComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OutstandingReportComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(OutstandingReportComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});