import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appNoSpecialChars]',
  standalone: true
})
export class NoSpecialCharsDirective {
  constructor(private elementRef: ElementRef<HTMLInputElement | HTMLTextAreaElement>) {}

  @HostListener('input')
  onInput(): void {
    const input = this.elementRef.nativeElement;

    /*
      Allows:
      - alphabets
      - numbers
      - spaces
      - hyphen
    */
    input.value = input.value.replace(/[^a-zA-Z0-9\s-]/g, '');
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') ?? '';

    if (/[^a-zA-Z0-9\s-]/.test(pastedText)) {
      event.preventDefault();
    }
  }

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    if (!/[a-zA-Z0-9\s-]/.test(event.key)) {
      event.preventDefault();
    }
  }
}