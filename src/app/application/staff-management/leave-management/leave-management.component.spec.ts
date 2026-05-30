import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeaveManagementComponent } from './leave-management.component';
import { MessageService } from 'primeng/api';

describe('LeaveManagementComponent', () => {
    let component: LeaveManagementComponent;
    let fixture: ComponentFixture<LeaveManagementComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [LeaveManagementComponent],
            providers: [
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(LeaveManagementComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});