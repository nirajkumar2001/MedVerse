import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApprovedCasesComponent } from './approved-cases.component';

describe('ApprovedCasesComponent', () => {
  let component: ApprovedCasesComponent;
  let fixture: ComponentFixture<ApprovedCasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApprovedCasesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApprovedCasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

