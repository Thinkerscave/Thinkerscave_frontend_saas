import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StaffApplicationReviewComponent } from './staff-application-review.component';
import { MessageService } from 'primeng/api';

describe('StaffApplicationReviewComponent', () => {
    let component: StaffApplicationReviewComponent;
    let fixture: ComponentFixture<StaffApplicationReviewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StaffApplicationReviewComponent],
            providers: [
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(StaffApplicationReviewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});