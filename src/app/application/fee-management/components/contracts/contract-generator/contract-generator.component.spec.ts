import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContractGeneratorComponent } from './contract-generator.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('ContractGeneratorComponent', () => {
    let component: ContractGeneratorComponent;
    let fixture: ComponentFixture<ContractGeneratorComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ContractGeneratorComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ContractGeneratorComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});