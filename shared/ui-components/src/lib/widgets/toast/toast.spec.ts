import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ToastComponent } from './toast';
import { ToastService } from './toast.service';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    fixture.detectChanges();
  });

  it('shows a toast added through ToastService', () => {
    TestBed.inject(ToastService).show('Enregistré', 'success');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Enregistré');
  });
});
