import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicsWorkspaceComponent } from './academics-workspace.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('AcademicsWorkspaceComponent', () => {
    let component: AcademicsWorkspaceComponent;
    let fixture: ComponentFixture<AcademicsWorkspaceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicsWorkspaceComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicsWorkspaceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});