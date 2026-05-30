import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeeGroupListComponent } from './fee-group-list.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('FeeGroupListComponent', () => {
    let component: FeeGroupListComponent;
    let fixture: ComponentFixture<FeeGroupListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FeeGroupListComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FeeGroupListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});