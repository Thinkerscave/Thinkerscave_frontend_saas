import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicSettingsPageComponent } from './academic-settings-page.component';

describe('AcademicSettingsPageComponent', () => {
    let component: AcademicSettingsPageComponent;
    let fixture: ComponentFixture<AcademicSettingsPageComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicSettingsPageComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicSettingsPageComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});