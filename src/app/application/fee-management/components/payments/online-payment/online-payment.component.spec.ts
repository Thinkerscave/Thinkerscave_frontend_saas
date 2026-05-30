import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OnlinePaymentComponent } from './online-payment.component';
import { provideRouter } from '@angular/router';

describe('OnlinePaymentComponent', () => {
    let component: OnlinePaymentComponent;
    let fixture: ComponentFixture<OnlinePaymentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OnlinePaymentComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(OnlinePaymentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});