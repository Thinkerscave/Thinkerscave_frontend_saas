import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageClassComponent } from './manage-class.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

describe('ManageClassComponent', () => {
    let component: ManageClassComponent;
    let fixture: ComponentFixture<ManageClassComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ManageClassComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ManageClassComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});