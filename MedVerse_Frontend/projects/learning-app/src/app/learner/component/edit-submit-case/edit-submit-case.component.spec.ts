import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditSubmitCaseComponent } from './edit-submit-case.component';

describe('EditSubmitCaseComponent', () => {
  let component: EditSubmitCaseComponent;
  let fixture: ComponentFixture<EditSubmitCaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditSubmitCaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditSubmitCaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
