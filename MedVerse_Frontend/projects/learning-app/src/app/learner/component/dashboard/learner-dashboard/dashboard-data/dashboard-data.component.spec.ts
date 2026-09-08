import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardDataComponent } from './dashboard-data.component';

describe('DashboardDataComponent', () => {
  let component: DashboardDataComponent;
  let fixture: ComponentFixture<DashboardDataComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardDataComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
