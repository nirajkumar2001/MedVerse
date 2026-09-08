import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appAlphaOnly]',
  standalone: true
})
export class AlphaOnlyDirective {
  constructor(private elementRef: ElementRef<HTMLInputElement | HTMLTextAreaElement>) {}

  @HostListener('input')
  onInput(): void {
    const input = this.elementRef.nativeElement;

    /*
      Allows:
      - alphabets
      - spaces
    */
    input.value = input.value.replace(/[^a-zA-Z\s]/g, '');
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') ?? '';

    if (/[^a-zA-Z\s]/.test(pastedText)) {
      event.preventDefault();
    }
  }

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    if (!/[a-zA-Z\s]/.test(event.key)) {
      event.preventDefault();
    }
  }
}