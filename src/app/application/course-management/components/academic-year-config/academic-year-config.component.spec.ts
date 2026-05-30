import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicYearConfigComponent } from './academic-year-config.component';

describe('AcademicYearConfigComponent', () => {
    let component: AcademicYearConfigComponent;
    let fixture: ComponentFixture<AcademicYearConfigComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicYearConfigComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicYearConfigComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});