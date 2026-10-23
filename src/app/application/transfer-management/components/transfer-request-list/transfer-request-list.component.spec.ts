import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';

import { TransferRequestListComponent } from './transfer-request-list.component';

describe('TransferRequestListComponent', () => {
    let component: TransferRequestListComponent;
    let fixture: ComponentFixture<TransferRequestListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [TransferRequestListComponent],
            providers: [
                MessageService,
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                provideNoopAnimations()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(TransferRequestListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should start with no requests loaded', () => {
        expect(component.requests()).toEqual([]);
    });
});
