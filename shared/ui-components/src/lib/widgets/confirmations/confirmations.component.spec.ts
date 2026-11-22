import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationModalComponent } from './confirmations.component';

describe('ConfirmationModalComponent', () => {
  let fixture: ComponentFixture<ConfirmationModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationModalComponent],
      providers: [NgbActiveModal],
    }).compileComponents();
    fixture = TestBed.createComponent(ConfirmationModalComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('shows the default question, then a message set by the caller', async () => {
    expect(fixture.nativeElement.textContent).toContain('Are you sure?');

    fixture.componentInstance.message.set('Supprimer ce fichier ?');
    await fixture.whenStable();
    expect(fixture.nativeElement.textContent).toContain('Supprimer ce fichier ?');
  });

  it('closes the modal with true on submit', () => {
    const close = vi.spyOn(TestBed.inject(NgbActiveModal), 'close');
    fixture.componentInstance.submit();
    expect(close).toHaveBeenCalledWith(true);
  });
});
