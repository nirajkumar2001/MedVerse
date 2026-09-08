import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceLimitReachedComponent } from './device-limit-reached.component';

describe('DeviceLimitReachedComponent', () => {
  let component: DeviceLimitReachedComponent;
  let fixture: ComponentFixture<DeviceLimitReachedComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceLimitReachedComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeviceLimitReachedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
