import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FollowUpTrackerComponent } from './follow-up-tracker.component';
import { provideRouter } from '@angular/router';

describe('FollowUpTrackerComponent', () => {
    let component: FollowUpTrackerComponent;
    let fixture: ComponentFixture<FollowUpTrackerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FollowUpTrackerComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FollowUpTrackerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});