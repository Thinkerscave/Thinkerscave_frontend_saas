import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InquiryFollowupComponent } from './inquiry-followup.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('InquiryFollowupComponent', () => {
    let component: InquiryFollowupComponent;
    let fixture: ComponentFixture<InquiryFollowupComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InquiryFollowupComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(InquiryFollowupComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});