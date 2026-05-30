import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InquiryDetailComponent } from './inquiry-detail.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('InquiryDetailComponent', () => {
    let component: InquiryDetailComponent;
    let fixture: ComponentFixture<InquiryDetailComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InquiryDetailComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(InquiryDetailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});