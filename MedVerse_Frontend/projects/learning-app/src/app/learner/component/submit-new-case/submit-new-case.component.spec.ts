import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitNewCaseComponent } from './submit-new-case.component';

describe('SubmitNewCaseComponent', () => {
  let component: SubmitNewCaseComponent;
  let fixture: ComponentFixture<SubmitNewCaseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmitNewCaseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubmitNewCaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
