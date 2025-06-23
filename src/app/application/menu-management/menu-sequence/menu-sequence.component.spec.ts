import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuSequenceComponent } from './menu-sequence.component';

describe('MenuSequenceComponent', () => {
  let component: MenuSequenceComponent;
  let fixture: ComponentFixture<MenuSequenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuSequenceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuSequenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
