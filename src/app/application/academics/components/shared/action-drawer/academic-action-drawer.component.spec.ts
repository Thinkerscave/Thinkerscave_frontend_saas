import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicActionDrawerComponent } from './academic-action-drawer.component';

describe('AcademicActionDrawerComponent', () => {
    let component: AcademicActionDrawerComponent;
    let fixture: ComponentFixture<AcademicActionDrawerComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicActionDrawerComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicActionDrawerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});