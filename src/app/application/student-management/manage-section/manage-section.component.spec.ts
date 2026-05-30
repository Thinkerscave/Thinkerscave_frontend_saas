import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageSectionComponent } from './manage-section.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

describe('ManageSectionComponent', () => {
    let component: ManageSectionComponent;
    let fixture: ComponentFixture<ManageSectionComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ManageSectionComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ManageSectionComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});