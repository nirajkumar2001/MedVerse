import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthOfficerDashboardComponent } from './auth-officer-dashboard.component';

describe('AuthOfficerDashboardComponent', () => {
  let component: AuthOfficerDashboardComponent;
  let fixture: ComponentFixture<AuthOfficerDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthOfficerDashboardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthOfficerDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

