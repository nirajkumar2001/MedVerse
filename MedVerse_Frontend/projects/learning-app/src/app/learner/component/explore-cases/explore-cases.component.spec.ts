import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExploreCasesComponent } from './explore-cases.component';

describe('ExploreCasesComponent', () => {
  let component: ExploreCasesComponent;
  let fixture: ComponentFixture<ExploreCasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExploreCasesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExploreCasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
