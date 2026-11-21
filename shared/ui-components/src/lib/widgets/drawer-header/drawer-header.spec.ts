import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawerHeader } from './drawer-header';

describe('DrawerHeader', () => {
  let fixture: ComponentFixture<DrawerHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrawerHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(DrawerHeader);
    fixture.componentRef.setInput('user', { first_name: 'Amel', last_name: 'Ben Ali' });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
