import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { provideTranslateService } from '@ngx-translate/core';
import { AppModalWrapperComponent } from './modal-wrapper-component.component';

describe('AppModalWrapperComponent', () => {
  let fixture: ComponentFixture<AppModalWrapperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppModalWrapperComponent],
      providers: [provideTranslateService(), NgbActiveModal],
    }).compileComponents();

    fixture = TestBed.createComponent(AppModalWrapperComponent);
    fixture.componentInstance.title.set('labels.money_movement_form');
    fixture.detectChanges();
  });

  it('should create with no content component', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
