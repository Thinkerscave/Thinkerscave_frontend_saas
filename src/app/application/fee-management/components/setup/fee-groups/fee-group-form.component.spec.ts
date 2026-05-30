import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeeGroupFormComponent } from './fee-group-form.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('FeeGroupFormComponent', () => {
    let component: FeeGroupFormComponent;
    let fixture: ComponentFixture<FeeGroupFormComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FeeGroupFormComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FeeGroupFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});