import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmergencyLookupComponent } from './emergency-lookup.component';

describe('EmergencyLookupComponent', () => {
  let component: EmergencyLookupComponent;
  let fixture: ComponentFixture<EmergencyLookupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmergencyLookupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmergencyLookupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
