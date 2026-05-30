import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InquiryAdmissionsWorkspaceComponent } from './inquiry-admissions-workspace.component';
import { provideRouter } from '@angular/router';

describe('InquiryAdmissionsWorkspaceComponent', () => {
    let component: InquiryAdmissionsWorkspaceComponent;
    let fixture: ComponentFixture<InquiryAdmissionsWorkspaceComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [InquiryAdmissionsWorkspaceComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(InquiryAdmissionsWorkspaceComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});