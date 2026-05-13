import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StandardListViewComponent } from './standard-list-view.component';

describe('StandardListViewComponent', () => {
  let component: StandardListViewComponent;
  let fixture: ComponentFixture<StandardListViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StandardListViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StandardListViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
