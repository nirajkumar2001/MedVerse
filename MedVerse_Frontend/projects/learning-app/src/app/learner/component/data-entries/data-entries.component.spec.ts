import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataEntriesComponent } from './data-entries.component';

describe('DataEntriesComponent', () => {
  let component: DataEntriesComponent;
  let fixture: ComponentFixture<DataEntriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataEntriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DataEntriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
