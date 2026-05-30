import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublicInquiryComponent } from './public-inquiry.component';
import { MessageService } from 'primeng/api';

describe('PublicInquiryComponent', () => {
    let component: PublicInquiryComponent;
    let fixture: ComponentFixture<PublicInquiryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PublicInquiryComponent],
            providers: [
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PublicInquiryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});