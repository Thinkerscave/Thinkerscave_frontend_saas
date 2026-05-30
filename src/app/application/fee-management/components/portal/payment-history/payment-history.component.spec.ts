import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortalPaymentHistoryComponent } from './payment-history.component';
import { provideRouter } from '@angular/router';

describe('PortalPaymentHistoryComponent', () => {
    let component: PortalPaymentHistoryComponent;
    let fixture: ComponentFixture<PortalPaymentHistoryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PortalPaymentHistoryComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PortalPaymentHistoryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});