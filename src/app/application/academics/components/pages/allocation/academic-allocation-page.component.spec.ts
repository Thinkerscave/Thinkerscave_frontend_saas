import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicAllocationPageComponent } from './academic-allocation-page.component';

describe('AcademicAllocationPageComponent', () => {
    let component: AcademicAllocationPageComponent;
    let fixture: ComponentFixture<AcademicAllocationPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicAllocationPageComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicAllocationPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});