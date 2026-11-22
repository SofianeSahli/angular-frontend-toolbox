import { ChangeDetectionStrategy, Component, NgZone, output, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { provideTranslateService } from '@ngx-translate/core';
import { AppModalWrapperComponent, DynamicComponentInterface } from './modal-wrapper-component.component';

// spec 001 T14 (REQ-3.5c): content placed in the modal wrapper must render and
// update after switching to OnPush. Opened through NgbModal, as List does.
@Component({
  selector: 'lib-probe-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="probe">{{ label }} / {{ message() }}</p>`,
})
class ProbeContent implements DynamicComponentInterface<string> {
  // Callers pass contentInputs into writable signals and plain properties.
  message = signal('');
  label = '';
  done = output<string>();
  submit() {
    this.done.emit('saved');
  }
}

describe('AppModalWrapperComponent with dynamic content', () => {
  const body = () => document.body.textContent ?? '';

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), provideNoopAnimations()],
    });
  });

  afterEach(() => TestBed.inject(NgbModal).dismissAll());

  /** Opens the modal and fills it in one zone turn, like List's click handler. */
  async function open() {
    const zone = TestBed.inject(NgZone);
    const modalRef = zone.run(() => {
      const ref = TestBed.inject(NgbModal).open(AppModalWrapperComponent);
      const wrapper = ref.componentInstance as AppModalWrapperComponent;
      wrapper.title.set('Formulaire');
      wrapper.contentComponent.set(ProbeContent);
      wrapper.contentInputs.set({ message: 'Bonjour', label: 'Texte' });
      return ref;
    });
    await new Promise((resolve) => setTimeout(resolve));
    return { modalRef, zone };
  }

  it('renders the title and the content with its inputs', async () => {
    await open();
    expect(body()).toContain('Formulaire');
    expect(document.querySelector('.probe')?.textContent).toContain('Texte / Bonjour');
  });

  it('closes with the result when the content emits done', async () => {
    const { modalRef, zone } = await open();
    const closed = new Promise((resolve) => modalRef.closed.subscribe(resolve));

    zone.run(() => (document.querySelector('.modal-footer .btn-primary') as HTMLButtonElement).click());

    await expect(closed).resolves.toBe('saved');
  });
});
