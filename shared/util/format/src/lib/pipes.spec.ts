import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LocalIsoDatePipe, MillimesHeadlinePipe, MillimesPipe, SignedMillimesPipe } from './pipes';

@Component({
  imports: [MillimesPipe, MillimesHeadlinePipe, SignedMillimesPipe, LocalIsoDatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span>{{ 1234500 | uiMillimes }}</span><span>{{ 1234500 | uiMillimesHeadline }}</span><span>{{ 2000 | uiSignedMillimes }}</span><span>{{ day | uiLocalIsoDate }}</span>`,
})
class Host {
  readonly day = new Date(2026, 2, 29, 0, 30);
}

const SPACES = new RegExp(`[${String.fromCharCode(0x202f, 0x00a0)}]`, 'g');

describe('format pipes (REQ-6.7)', () => {
  it('format in templates like their functions', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const texts = Array.from(fixture.nativeElement.querySelectorAll('span') as NodeListOf<HTMLElement>, (s) =>
      s.textContent?.replace(SPACES, ' '),
    );
    expect(texts).toEqual(['1 234,500 DT', '1 235 DT', '+2,000 DT', '2026-03-29']);
  });

  it('refuses non-integer millimes like the functions', () => {
    expect(() => new MillimesPipe().transform(1.5)).toThrow(RangeError);
  });
});
