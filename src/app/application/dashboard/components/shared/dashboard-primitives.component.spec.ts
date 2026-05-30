import { ComponentFixture, TestBed } from '@angular/core/testing';
import { KpiCardComponent } from './dashboard-primitives.component';

describe('KpiCardComponent', () => {
    let component: KpiCardComponent;
    let fixture: ComponentFixture<KpiCardComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [KpiCardComponent],
            providers: [
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(KpiCardComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});