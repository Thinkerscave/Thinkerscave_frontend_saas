import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdjustmentListComponent } from './adjustment-list.component';
import { provideRouter } from '@angular/router';

describe('AdjustmentListComponent', () => {
    let component: AdjustmentListComponent;
    let fixture: ComponentFixture<AdjustmentListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [AdjustmentListComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(AdjustmentListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});