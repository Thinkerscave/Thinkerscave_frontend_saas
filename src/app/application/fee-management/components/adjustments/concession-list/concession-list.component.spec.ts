import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConcessionListComponent } from './concession-list.component';
import { provideRouter } from '@angular/router';
import { MessageService } from 'primeng/api';

describe('ConcessionListComponent', () => {
    let component: ConcessionListComponent;
    let fixture: ComponentFixture<ConcessionListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ConcessionListComponent],
            providers: [
                provideRouter([]),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ConcessionListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});