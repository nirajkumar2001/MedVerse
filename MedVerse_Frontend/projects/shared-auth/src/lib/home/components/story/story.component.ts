import {
    AfterViewInit,
    Component,
    ElementRef,
    OnDestroy,
    QueryList,
    ViewChildren,
  } from '@angular/core';
  
  @Component({
    selector: 'app-story',
    standalone: true,
    templateUrl: './story.component.html',
    styleUrl: './story.component.scss',
  })
  export class StoryComponent implements AfterViewInit, OnDestroy {
    @ViewChildren('reveal') reveals!: QueryList<ElementRef<HTMLElement>>;
    private observer?: IntersectionObserver;
  
    ngAfterViewInit(): void {
      this.observer = new IntersectionObserver(
        entries => entries.forEach(e => e.target.classList.toggle('show', e.isIntersecting)),
        { threshold: 0.2 }
      );
  
      this.reveals.forEach(el => this.observer?.observe(el.nativeElement));
    }
  
    ngOnDestroy(): void {
      this.observer?.disconnect();
    }
  }