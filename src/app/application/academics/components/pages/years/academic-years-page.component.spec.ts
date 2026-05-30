import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicYearsPageComponent } from './academic-years-page.component';

describe('AcademicYearsPageComponent', () => {
    let component: AcademicYearsPageComponent;
    let fixture: ComponentFixture<AcademicYearsPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicYearsPageComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicYearsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});