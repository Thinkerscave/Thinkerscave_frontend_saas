import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RestrictionDashboardComponent } from './restriction-dashboard.component';
import { provideRouter } from '@angular/router';

describe('RestrictionDashboardComponent', () => {
    let component: RestrictionDashboardComponent;
    let fixture: ComponentFixture<RestrictionDashboardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [RestrictionDashboardComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RestrictionDashboardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});