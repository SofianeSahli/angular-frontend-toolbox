import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { provideTranslateService } from '@ngx-translate/core';
import { ErrorAlert } from './error-alert';

describe('ErrorAlert', () => {
  let fixture: ComponentFixture<ErrorAlert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorAlert],
      providers: [provideTranslateService(), NgbActiveModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorAlert);
    fixture.componentInstance.errors.set(['Network error: please check your connection.']);
    fixture.detectChanges();
  });

  it('shows each error message', () => {
    expect(fixture.nativeElement.textContent).toContain(
      'Network error: please check your connection.'
    );
  });
});
