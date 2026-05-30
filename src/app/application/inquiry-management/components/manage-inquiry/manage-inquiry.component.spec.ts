import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageInquiryComponent } from './manage-inquiry.component';
import { MessageService } from 'primeng/api';

describe('ManageInquiryComponent', () => {
    let component: ManageInquiryComponent;
    let fixture: ComponentFixture<ManageInquiryComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ManageInquiryComponent],
            providers: [
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ManageInquiryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});