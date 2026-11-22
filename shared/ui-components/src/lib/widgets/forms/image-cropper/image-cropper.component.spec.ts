import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ImageCropperComponent } from './image-cropper.component';

// spec 001 T14: render check only. The cropper draws with fabric.js on a canvas,
// which jsdom cannot provide, and it is only reachable behind sign-in.
describe('ImageCropperComponent', () => {
  let fixture: ComponentFixture<ImageCropperComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImageCropperComponent],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(ImageCropperComponent);
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  it('renders its toolbar with no images', () => {
    expect(fixture.nativeElement.querySelectorAll('button').length).toBeGreaterThan(0);
    expect(fixture.componentInstance.previews).toEqual([]);
  });
});
