import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appDigitsOnly]',
  standalone: true
})
export class DigitsOnlyDirective {
  constructor(private elementRef: ElementRef<HTMLInputElement>) {}

  @HostListener('input')
  onInput(): void {
    const input = this.elementRef.nativeElement;
    input.value = input.value.replace(/[^0-9]/g, '');
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') ?? '';

    if (/[^0-9]/.test(pastedText)) {
      event.preventDefault();
    }
  }

  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent): void {
    if (!/[0-9]/.test(event.key)) {
      event.preventDefault();
    }
  }
}