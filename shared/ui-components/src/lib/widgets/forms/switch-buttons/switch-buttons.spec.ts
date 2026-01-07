import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SwitchButtons } from './switch-buttons';

describe('SwitchButtons', () => {
  let component: SwitchButtons;
  let fixture: ComponentFixture<SwitchButtons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SwitchButtons],
    }).compileComponents();

    fixture = TestBed.createComponent(SwitchButtons);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
