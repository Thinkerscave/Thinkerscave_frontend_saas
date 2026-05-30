import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeeHeadListComponent } from './fee-head-list.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('FeeHeadListComponent', () => {
    let component: FeeHeadListComponent;
    let fixture: ComponentFixture<FeeHeadListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [FeeHeadListComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(FeeHeadListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});