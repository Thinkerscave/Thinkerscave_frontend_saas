import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntityAuditTrailComponent } from './entity-audit-trail.component';
import { provideRouter } from '@angular/router';

describe('EntityAuditTrailComponent', () => {
    let component: EntityAuditTrailComponent;
    let fixture: ComponentFixture<EntityAuditTrailComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [EntityAuditTrailComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(EntityAuditTrailComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});