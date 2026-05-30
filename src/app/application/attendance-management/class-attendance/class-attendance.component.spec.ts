import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClassAttendanceComponent } from './class-attendance.component';
import { MessageService } from 'primeng/api';

describe('ClassAttendanceComponent', () => {
    let component: ClassAttendanceComponent;
    let fixture: ComponentFixture<ClassAttendanceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ClassAttendanceComponent],
            providers: [
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ClassAttendanceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});