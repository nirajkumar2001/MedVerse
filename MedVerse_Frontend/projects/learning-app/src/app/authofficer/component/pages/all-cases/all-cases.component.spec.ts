import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllCasesComponent } from './all-cases.component';

describe('AllCasesComponent', () => {
  let component: AllCasesComponent;
  let fixture: ComponentFixture<AllCasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllCasesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllCasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

