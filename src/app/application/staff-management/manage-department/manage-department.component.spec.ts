import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageDepartmentComponent } from './manage-department.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

describe('ManageDepartmentComponent', () => {
    let component: ManageDepartmentComponent;
    let fixture: ComponentFixture<ManageDepartmentComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ManageDepartmentComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ManageDepartmentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});