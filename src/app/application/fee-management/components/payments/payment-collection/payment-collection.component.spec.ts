import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentCollectionComponent } from './payment-collection.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('PaymentCollectionComponent', () => {
    let component: PaymentCollectionComponent;
    let fixture: ComponentFixture<PaymentCollectionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PaymentCollectionComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PaymentCollectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});