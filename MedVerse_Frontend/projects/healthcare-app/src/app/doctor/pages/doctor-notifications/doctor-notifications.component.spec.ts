import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorNotificationsComponent } from './doctor-notifications.component';

describe('DoctorNotificationsComponent', () => {
  let component: DoctorNotificationsComponent;
  let fixture: ComponentFixture<DoctorNotificationsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorNotificationsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorNotificationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
