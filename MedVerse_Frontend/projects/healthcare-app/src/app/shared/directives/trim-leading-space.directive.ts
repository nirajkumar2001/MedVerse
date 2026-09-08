import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appTrimLeadingSpace]',
  standalone: true
})
export class TrimLeadingSpaceDirective {
  constructor(private elementRef: ElementRef<HTMLInputElement | HTMLTextAreaElement>) {}

  @HostListener('input')
  onInput(): void {
    const input = this.elementRef.nativeElement;

    if (/^\s+/.test(input.value)) {
      input.value = input.value.replace(/^\s+/, '');
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    const input = this.elementRef.nativeElement;
    const cursorPosition = input.selectionStart ?? 0;

    if (event.key === ' ' && cursorPosition === 0) {
      event.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const pastedText = event.clipboardData?.getData('text') ?? '';

    if (/^\s/.test(pastedText)) {
      event.preventDefault();

      const cleanedText = pastedText.replace(/^\s+/, '');
      const input = this.elementRef.nativeElement;
      const start = input.selectionStart ?? input.value.length;
      const end = input.selectionEnd ?? input.value.length;

      input.value =
        input.value.substring(0, start) +
        cleanedText +
        input.value.substring(end);

      input.dispatchEvent(new Event('input'));
    }
  }
}