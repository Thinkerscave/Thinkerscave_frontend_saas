import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StaffAttendanceComponent } from './staff-attendance.component';
import { MessageService } from 'primeng/api';

describe('StaffAttendanceComponent', () => {
    let component: StaffAttendanceComponent;
    let fixture: ComponentFixture<StaffAttendanceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StaffAttendanceComponent],
            providers: [
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(StaffAttendanceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});