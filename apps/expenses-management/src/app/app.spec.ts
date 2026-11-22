import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScrollService, ToastService } from '@shared/ui-components';
import { appTestProviders } from '../testing/test-providers';
import { App } from './app';

describe('App', () => {
  let fixture: ComponentFixture<App>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: appTestProviders(),
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('shows toasts from ToastService', async () => {
    TestBed.inject(ToastService).show('Enregistré', 'success');
    await Promise.resolve();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Enregistré');
  });

  it('asks for more items when the content is scrolled to the bottom', () => {
    const trigger = vi.spyOn(TestBed.inject(ScrollService), 'triggerLoadMore');
    fixture.componentInstance.onScroll({
      target: { scrollHeight: 1000, scrollTop: 900, clientHeight: 100 },
    });
    expect(trigger).toHaveBeenCalled();
  });
});
