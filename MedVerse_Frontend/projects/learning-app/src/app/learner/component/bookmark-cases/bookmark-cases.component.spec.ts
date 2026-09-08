import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BookmarkCasesComponent } from './bookmark-cases.component';

describe('BookmarkCasesComponent', () => {
  let component: BookmarkCasesComponent;
  let fixture: ComponentFixture<BookmarkCasesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BookmarkCasesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BookmarkCasesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
