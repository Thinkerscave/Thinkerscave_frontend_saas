import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagestudentComponent } from './managestudent.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

describe('ManagestudentComponent', () => {
    let component: ManagestudentComponent;
    let fixture: ComponentFixture<ManagestudentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ManagestudentComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ManagestudentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});