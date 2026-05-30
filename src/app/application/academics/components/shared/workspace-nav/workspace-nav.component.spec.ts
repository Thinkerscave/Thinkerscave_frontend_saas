import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicWorkspaceNavComponent } from './workspace-nav.component';
import { provideRouter } from '@angular/router';

describe('AcademicWorkspaceNavComponent', () => {
    let component: AcademicWorkspaceNavComponent;
    let fixture: ComponentFixture<AcademicWorkspaceNavComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicWorkspaceNavComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicWorkspaceNavComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});