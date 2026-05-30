import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AcademicSmartHeroComponent } from './smart-hero.component';

describe('AcademicSmartHeroComponent', () => {
    let component: AcademicSmartHeroComponent;
    let fixture: ComponentFixture<AcademicSmartHeroComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AcademicSmartHeroComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AcademicSmartHeroComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});