import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DrawerHeader } from './drawer-header';

describe('DrawerHeader', () => {
  let component: DrawerHeader;
  let fixture: ComponentFixture<DrawerHeader>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DrawerHeader],
    }).compileComponents();

    fixture = TestBed.createComponent(DrawerHeader);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
