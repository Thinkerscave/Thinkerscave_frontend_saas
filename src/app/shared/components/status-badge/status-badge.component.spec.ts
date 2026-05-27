import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
    let component: StatusBadgeComponent;
    let fixture: ComponentFixture<StatusBadgeComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [StatusBadgeComponent]
        }).compileComponents();

        fixture = TestBed.createComponent(StatusBadgeComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should map a known status to a semantic tone', () => {
        component.status = 'ACTIVE';
        expect(component.resolvedTone).toBe('success');
    });

    it('should fall back to default when status is unknown', () => {
        component.status = 'WHATEVER';
        expect(component.resolvedTone).toBe('default');
    });

    it('should honor an explicit tone override', () => {
        component.status = 'ACTIVE';
        component.tone = 'warning';
        expect(component.resolvedTone).toBe('warning');
    });
});
