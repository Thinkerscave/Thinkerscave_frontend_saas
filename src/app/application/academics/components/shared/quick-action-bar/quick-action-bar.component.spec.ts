import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicQuickActionBarComponent } from './quick-action-bar.component';

describe('AcademicQuickActionBarComponent', () => {
    let component: AcademicQuickActionBarComponent;
    let fixture: ComponentFixture<AcademicQuickActionBarComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicQuickActionBarComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicQuickActionBarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});