import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCasesComponent } from './dashboard-cases.component';

describe('DashboardCasesComponent', () => {
  let component: DashboardCasesComponent;
  let fixture: ComponentFixture<DashboardCasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCasesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
