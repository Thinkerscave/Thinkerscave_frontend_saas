import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PayOnlineComponent } from './pay-online.component';
import { provideRouter } from '@angular/router';

describe('PayOnlineComponent', () => {
    let component: PayOnlineComponent;
    let fixture: ComponentFixture<PayOnlineComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PayOnlineComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PayOnlineComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});