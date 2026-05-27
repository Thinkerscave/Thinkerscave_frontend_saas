import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MessageService } from 'primeng/api';

import { NoticeListComponent } from './notice-list.component';

describe('NoticeListComponent', () => {
    let component: NoticeListComponent;
    let fixture: ComponentFixture<NoticeListComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [NoticeListComponent],
            providers: [
                MessageService,
                provideHttpClient(),
                provideHttpClientTesting(),
                provideRouter([]),
                provideNoopAnimations()
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(NoticeListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should start with no notices loaded', () => {
        expect(component.notices()).toEqual([]);
    });
});
