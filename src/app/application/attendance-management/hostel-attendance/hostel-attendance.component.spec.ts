import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HostelAttendanceComponent } from './hostel-attendance.component';
import { MessageService } from 'primeng/api';

describe('HostelAttendanceComponent', () => {
    let component: HostelAttendanceComponent;
    let fixture: ComponentFixture<HostelAttendanceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [HostelAttendanceComponent],
            providers: [
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(HostelAttendanceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});