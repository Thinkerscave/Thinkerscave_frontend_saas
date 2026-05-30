import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeeStructureViewComponent } from './fee-structure-view.component';
import { provideRouter } from '@angular/router';

describe('FeeStructureViewComponent', () => {
    let component: FeeStructureViewComponent;
    let fixture: ComponentFixture<FeeStructureViewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FeeStructureViewComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FeeStructureViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});