import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeeContractViewComponent } from './fee-contract-view.component';
import { provideRouter } from '@angular/router';

describe('FeeContractViewComponent', () => {
    let component: FeeContractViewComponent;
    let fixture: ComponentFixture<FeeContractViewComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FeeContractViewComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FeeContractViewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});