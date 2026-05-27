import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { KpiCardComponent } from './kpi-card.component';

describe('KpiCardComponent', () => {
    let component: KpiCardComponent;
    let fixture: ComponentFixture<KpiCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [KpiCardComponent],
            providers: [
                provideRouter([]),
                provideNoopAnimations()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(KpiCardComponent);
        component = fixture.componentInstance;
        component.label = 'Total';
        component.value = 42;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should accept a tone input', () => {
        component.tone = 'success';
        fixture.detectChanges();
        expect(component.tone).toBe('success');
    });
});
