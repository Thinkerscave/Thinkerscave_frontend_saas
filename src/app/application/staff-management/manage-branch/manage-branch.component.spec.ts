import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageBranchComponent } from './manage-branch.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MessageService } from 'primeng/api';

describe('ManageBranchComponent', () => {
    let component: ManageBranchComponent;
    let fixture: ComponentFixture<ManageBranchComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ManageBranchComponent],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ManageBranchComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});