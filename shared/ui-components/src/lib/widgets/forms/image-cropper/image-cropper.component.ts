import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  inject,
  input,
  output,
  effect,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import * as fabric from 'fabric';
import { filters } from 'fabric';
import { ChangeDetectorRef } from '@angular/core';
import { DynamicComponentInterface } from '../../modal-wrapper-component/modal-wrapper-component.component';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-image-cropper',
  templateUrl: './image-cropper.component.html',
  styleUrls: ['./image-cropper.component.scss'],
  standalone: true,
  imports: [FormsModule, TranslatePipe],
})
export class ImageCropperComponent
  implements OnDestroy, DynamicComponentInterface<File[]>
{
  images = signal<File[]>([]);
  done = output<File[]>();
  activeModal?: NgbActiveModal | undefined;
  loading?: boolean = false;

  @ViewChild('canvasWrapper', { static: true })
  canvasWrapper!: ElementRef<HTMLDivElement>;
  @ViewChild('canvasContainer', { static: true })
  canvasContainer!: ElementRef<HTMLCanvasElement>;
  changeDetectorRef = inject(ChangeDetectorRef);
  canvas!: fabric.Canvas;
  previews: string[] = [];
  currentIndex = 0;
  croppedFiles: File[] = [];
  cropShape: 'circle' | 'square' = 'circle';
  clipObj: fabric.Object | null = null;
  originalImageState: string | null = null;

  // filters
  brightness = 0;
  contrast = 0;
  saturation = 0;
  hue = 0;
  blur = 0;

  constructor() {
    effect(() => {
      if (this.images().length) this.setUpView();
    });
  }
  setUpView() {
    this.initPreviews();
    this.initCanvas();
    this.loadImage(this.currentIndex);
    this.makeCanvasResponsive();
    this.changeDetectorRef.detectChanges();
    window.addEventListener('resize', this.makeCanvasResponsive.bind(this));
  }

  ngOnDestroy() {
    this.previews.forEach((url) => URL.revokeObjectURL(url));
    window.removeEventListener('resize', this.makeCanvasResponsive.bind(this));
  }

  private initPreviews() {
    this.previews = this.images().map((f) => URL.createObjectURL(f));
    
  }

  private initCanvas() {
    this.canvas = new fabric.Canvas(this.canvasContainer.nativeElement, {
      preserveObjectStacking: true,
      selection: false,
      backgroundColor: '#fff',
    });
  }

  private makeCanvasResponsive() {
    const wrapper = this.canvasWrapper.nativeElement;
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight || 400;
    this.canvas.setWidth(width);
    this.canvas.setHeight(height);
    this.canvas.renderAll();
  }

  private loadImage(index: number) {
    if (index < 0 || index >= this.images().length) return;

    const url = this.previews[index];
    fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' }).then(
      (img) => {
        this.canvas.clear();
        img.set({ selectable: true, centeredScaling: true });
        img.scaleToWidth(this.canvas.getWidth() * 0.9);
        this.canvas.add(img);
        this.canvas.centerObject(img);
        this.canvas.setActiveObject(img);
        this.canvas.renderAll();
        this.originalImageState = JSON.stringify(img.toObject(['clipPathId']));
      }
    );
  }

  openImage(index: number) {
    this.currentIndex = index;
    this.loadImage(index);
    this.resetFilters();
  }

  saveCurrentCropped() {
    if (!this.canvas) return;
    const dataUrl = this.canvas.toDataURL({ format: 'png', multiplier: 1 });
    const blob = this.dataURLtoBlob(dataUrl);
    this.croppedFiles[this.currentIndex] = new File(
      [blob],
      `cropped-${this.currentIndex}.png`,
      { type: blob.type }
    );
  }

  async submit() {
    try {
      this.loading = true;
      this.saveCurrentCropped();

      if (this.currentIndex + 1 < this.images().length) {
        this.openImage(this.currentIndex + 1);
      } else {
        await this.finishCropping();
      }
    } catch (error) {
      console.error('Cropping error:', error);
    } finally {
      this.loading = false;
    }
  }

  async finishCropping() {
    // Ensure all cropped files exist
    this.images().forEach((img, i) => {
      if (!this.croppedFiles[i]) {
        this.croppedFiles[i] = new File([img], `image-${i}.png`);
      }
    });

    // ✅ Notify parent modal or listener
    if (this.done) {
      this.done.emit(this.croppedFiles);
    }

    // ✅ Close modal cleanly if it was injected
    if (this.activeModal) {
      this.activeModal.close(this.croppedFiles);
    }
  }

  private dataURLtoBlob(dataURL: string) {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // --- Transforms ---
  rotateLeft() {
    const obj = this.canvas.getActiveObject();
    if (obj) {
      obj.rotate((obj.angle || 0) - 90);
      this.canvas.renderAll();
    }
  }

  rotateRight() {
    const obj = this.canvas.getActiveObject();
    if (obj) {
      obj.rotate((obj.angle || 0) + 90);
      this.canvas.renderAll();
    }
  }

  flipH() {
    const obj = this.canvas.getActiveObject();
    if (obj) {
      obj.set('flipX', !obj.flipX);
      this.canvas.renderAll();
    }
  }

  flipV() {
    const obj = this.canvas.getActiveObject();
    if (obj) {
      obj.set('flipY', !obj.flipY);
      this.canvas.renderAll();
    }
  }

  zoomIn() {
    const obj = this.canvas.getActiveObject();
    if (obj) {
      obj.scale(obj.scaleX! * 1.1);
      this.canvas.renderAll();
    }
  }

  zoomOut() {
    const obj = this.canvas.getActiveObject();
    if (obj) {
      obj.scale(obj.scaleX! * 0.9);
      this.canvas.renderAll();
    }
  }

  applyFilter() {
    const obj = this.canvas.getActiveObject();
    if (!obj) return;

    // Check if the object is an image before applying filters
    if (obj instanceof fabric.FabricImage) {
      obj.filters = [];
      if (this.brightness !== 0)
        obj.filters.push(
          new filters.Brightness({ brightness: this.brightness })
        );
      if (this.contrast !== 0)
        obj.filters.push(new filters.Contrast({ contrast: this.contrast }));
      if (this.saturation !== 0)
        obj.filters.push(
          new filters.Saturation({ saturation: this.saturation })
        );
      if (this.hue !== 0)
        obj.filters.push(new filters.HueRotation({ rotation: this.hue }));
      if (this.blur !== 0)
        obj.filters.push(new filters.Blur({ blur: this.blur }));

      obj.applyFilters();
    }
    // Always call renderAll(), even if no filter was applied
    this.canvas.requestRenderAll();
  }

  resetFilters() {
    this.brightness = 0;
    this.contrast = 0;
    this.saturation = 0;
    this.hue = 0;
    this.blur = 0;

    const obj = this.canvas.getActiveObject() as fabric.FabricImage;
    if (obj) {
      obj.filters = [];
      obj.applyFilters();
      this.canvas.renderAll();
    }
  }

  // --- Add Text ---
  addText(text: string) {
    const txt = new fabric.Textbox(text, {
      left: this.canvas.getWidth() / 2,
      top: this.canvas.getHeight() / 2,
      fontSize: 24,
      fill: '#000',
      editable: true,
      fontFamily: 'Arial',
      originX: 'center',
      originY: 'center',
    });
    this.canvas.add(txt);
    this.canvas.setActiveObject(txt);
    this.canvas.renderAll();
  }

  // --- Update text style ---
  updateTextStyle(options: {
    fontSize?: number;
    fill?: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    underline?: boolean;
    fontFamily?: string;
  }) {
    const obj = this.canvas.getActiveObject();
    if (obj && obj.type === 'textbox') {
      obj.set(options);
      this.canvas.renderAll();
    }
  }

  addOverlayImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const url = URL.createObjectURL(file);
      fabric.FabricImage.fromURL(url).then((img) => {
        img.set({
          left: this.canvas.getWidth() / 2,
          top: this.canvas.getHeight() / 2,
          selectable: true,
          originX: 'center',
          originY: 'center',
        });
        img.scaleToWidth(this.canvas.getWidth() / 3);
        this.canvas.add(img);
        this.canvas.setActiveObject(img);
        this.canvas.renderAll();
      });
    };
    input.click();
  }

  setCropShape(shape: 'circle' | 'square') {
    this.cropShape = shape;
    this.setupCropper();
  }

  setupCropper() {
    const obj = this.canvas.getActiveObject() as fabric.Image;
    if (!obj) return;

    obj.set({ clipPath: null });
    if (this.clipObj) this.canvas.remove(this.clipObj);

    const { tl, tr, bl } = obj.aCoords!;
    const objWidth = tr.x - tl.x;
    const objHeight = bl.y - tl.y;
    const objCenter = obj.getCenterPoint();

    const commonProps = {
      left: objCenter.x,
      top: objCenter.y,
      originX: 'center' as fabric.TOriginX,
      originY: 'center' as fabric.TOriginY,
      fill: 'transparent',
      stroke: 'rgba(255,255,255,0.7)',
      strokeWidth: 2,
      hasBorders: true,
      hasControls: true,
      lockRotation: true,
      scaleX: 1,
      scaleY: 1,
    };

    if (this.cropShape === 'circle') {
      this.clipObj = new fabric.Circle({
        ...commonProps,
        radius: Math.min(objWidth, objHeight) / 4,
      });
    } else {
      this.clipObj = new fabric.Rect({
        ...commonProps,
        width: objWidth / 2,
        height: objHeight / 2,
      });
    }

    this.canvas.add(this.clipObj);
    this.canvas.bringObjectToFront(this.clipObj);
    this.canvas.setActiveObject(this.clipObj);
    this.canvas.renderAll();
  }

  async applyCrop() {
    const obj = this.canvas.getActiveObject() as fabric.FabricImage;
    if (!obj || !this.clipObj) return;

    const clip = await this.clipObj.clone();

    this.canvas.remove(this.clipObj);
    this.clipObj = null;

    this.canvas.discardActiveObject();

    clip.set({
      left: clip.left! - obj.left!,
      top: clip.top! - obj.top!,
      scaleX: 1,
      scaleY: 1,
      originX: 'center',
      originY: 'center',
      fill: 'black',
      stroke: '',
      strokeWidth: 0,
    });

    obj.set({ clipPath: clip });

    this.canvas.centerObject(obj);
    this.canvas.setActiveObject(obj);
    this.canvas.renderAll();
  }

  cancelModifications() {
    if (this.clipObj) {
      this.canvas.remove(this.clipObj);
      this.clipObj = null;
    }

    const activeObject = this.canvas.getActiveObject();
    if (activeObject && this.originalImageState) {
      this.canvas.remove(activeObject);
      const imgState = JSON.parse(this.originalImageState);
      fabric.FabricImage.fromObject(imgState).then((img) => {
        this.canvas.add(img);
        this.canvas.centerObject(img);
        this.canvas.setActiveObject(img);
        this.canvas.renderAll();
      });
    } else {
      this.canvas.clear();
    }
    this.resetFilters();
  }
}
