import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeeContractListComponent } from './fee-contract-list.component';
import { provideRouter } from '@angular/router';

describe('FeeContractListComponent', () => {
    let component: FeeContractListComponent;
    let fixture: ComponentFixture<FeeContractListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FeeContractListComponent],
            providers: [
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FeeContractListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});