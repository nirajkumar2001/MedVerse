import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RejectedCasesComponent } from './rejected-cases.component';

describe('RejectedCasesComponent', () => {
  let component: RejectedCasesComponent;
  let fixture: ComponentFixture<RejectedCasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RejectedCasesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RejectedCasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

