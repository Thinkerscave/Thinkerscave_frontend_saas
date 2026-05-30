import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReceiptListComponent } from './receipt-list.component';
import { provideRouter } from '@angular/router';

describe('ReceiptListComponent', () => {
    let component: ReceiptListComponent;
    let fixture: ComponentFixture<ReceiptListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ReceiptListComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ReceiptListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});