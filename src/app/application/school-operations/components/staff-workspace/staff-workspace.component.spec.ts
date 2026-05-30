import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StaffWorkspaceComponent } from './staff-workspace.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('StaffWorkspaceComponent', () => {
    let component: StaffWorkspaceComponent;
    let fixture: ComponentFixture<StaffWorkspaceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StaffWorkspaceComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(StaffWorkspaceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});