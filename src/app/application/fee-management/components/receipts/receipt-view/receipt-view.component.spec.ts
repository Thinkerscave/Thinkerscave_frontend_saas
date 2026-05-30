import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceiptViewComponent } from './receipt-view.component';
import { provideRouter } from '@angular/router';

describe('ReceiptViewComponent', () => {
    let component: ReceiptViewComponent;
    let fixture: ComponentFixture<ReceiptViewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReceiptViewComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ReceiptViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});