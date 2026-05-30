import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminWorkspaceComponent } from './admin-workspace.component';
import { provideRouter } from '@angular/router';

describe('AdminWorkspaceComponent', () => {
    let component: AdminWorkspaceComponent;
    let fixture: ComponentFixture<AdminWorkspaceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdminWorkspaceComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AdminWorkspaceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});