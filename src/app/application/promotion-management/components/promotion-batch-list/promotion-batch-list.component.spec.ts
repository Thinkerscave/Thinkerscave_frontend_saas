import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';

import { PromotionBatchListComponent } from './promotion-batch-list.component';

describe('PromotionBatchListComponent', () => {
    let component: PromotionBatchListComponent;
    let fixture: ComponentFixture<PromotionBatchListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [PromotionBatchListComponent],
            providers: [
                MessageService,
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                provideNoopAnimations()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(PromotionBatchListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should start with no batches loaded', () => {
        expect(component.batches()).toEqual([]);
    });
});
