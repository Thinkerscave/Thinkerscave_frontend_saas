import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeeStructureListComponent } from './fee-structure-list.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('FeeStructureListComponent', () => {
    let component: FeeStructureListComponent;
    let fixture: ComponentFixture<FeeStructureListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FeeStructureListComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FeeStructureListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});