import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManageRoleComponent } from './manage-role.component';
import { MessageService } from 'primeng/api';

describe('ManageRoleComponent', () => {
    let component: ManageRoleComponent;
    let fixture: ComponentFixture<ManageRoleComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [ManageRoleComponent],
            providers: [
                MessageService
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ManageRoleComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});