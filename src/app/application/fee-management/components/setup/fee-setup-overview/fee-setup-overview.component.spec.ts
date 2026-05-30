import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeeSetupOverviewComponent } from './fee-setup-overview.component';
import { provideRouter } from '@angular/router';

describe('FeeSetupOverviewComponent', () => {
    let component: FeeSetupOverviewComponent;
    let fixture: ComponentFixture<FeeSetupOverviewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FeeSetupOverviewComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FeeSetupOverviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});