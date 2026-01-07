import { Component, inject, OnChanges, OnInit } from '@angular/core';
import { FieldType, FormlyModule } from '@ngx-formly/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { AppModalWrapperComponent } from '../../modal-wrapper-component/modal-wrapper-component.component';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ImageCropperComponent } from '../image-cropper/image-cropper.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { ConfirmationModalComponent } from '../../confirmations/confirmations.component';
import { signal, WritableSignal } from '@angular/core';

export interface FileModel {
  id: string;
  file_path: string;
  file_type: string;
  linked_object_type: string;
  linked_object_id: string;
  file_extension: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-files-input',
  templateUrl: './files-input.html',
  styleUrls: ['./files-input.scss'],
  standalone: true,
  imports: [
    FormsModule,
    FormlyModule,
    CommonModule,
    TranslatePipe,
    ReactiveFormsModule,
  ],
  animations: [
    trigger('fadeTranslate', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0, transform: 'translateY(20px)' })),
      ]),
    ]),
  ],
})
export class FilesInput extends FieldType implements OnChanges, OnInit {
  modalService = inject(NgbModal);
  filesToUpload: WritableSignal<File[]> = signal([]);
  previews: WritableSignal<
    { type: 'image' | 'video' | 'document'; url: string; name: string; id?: string }[]
  > = signal([]);

  currentIndex = 0;

  get control(): FormControl {
    return this.formControl as FormControl;
  }

  ngOnInit() {
    this.setInitialPreview();
    this.control.valueChanges.subscribe((val) => {
      if (val && Array.isArray(val)) {
        this.setInitialPreview(val);
      }
    });
  }

  ngOnChanges() {
    this.setInitialPreview();
  }

  private setInitialPreview(value?: any) {
    const modelValue = value || this.formControl.value;

    if (Array.isArray(modelValue)) {
      this.previews.set(
        modelValue.map((file) => {
          if ((file as FileModel).file_path) {
            const fm = file as FileModel;
            return {
              type: this.detectFileType(fm.file_type),
              url:  `${fm.file_path}`,
              name: fm.file_path.split('/').pop() || '',
              id: fm.id,
            };
          }
          if (typeof file === 'string') {
            return { type: 'document', url: file, name: this.extractName(file) };
          }
          return this.mapFileToPreview(file as File);
        })
      );
    } else {
      this.previews.set([]);
    }
  }

  private detectFileType(fileType: string): 'image' | 'video' | 'document' {
    if (!fileType) return 'document';
    const type = fileType.toUpperCase();
    if (type === 'IMAGE' || type === 'GIF') return 'image';
    if (type === 'VIDEO') return 'video';
    if (['PDF', 'HTML', 'AUDIO', 'OTHER'].includes(type)) return 'document';
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.startsWith('video/')) return 'video';
    const lower = fileType.toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif'].some((ext) => lower.endsWith(ext))) return 'image';
    if (['.mp4', '.webm'].some((ext) => lower.endsWith(ext))) return 'video';
    return 'document';
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    const otherFiles = files.filter((f) => !f.type.startsWith('image/'));

    this.handleFiles(otherFiles);

    if (imageFiles.length > 0) {
      const modalRef = this.modalService.open(AppModalWrapperComponent, {
        centered: true,
        size: 'xl',
      });

      modalRef.componentInstance.title.set('Crop Images');
      modalRef.componentInstance.contentComponent.set(ImageCropperComponent);
      modalRef.componentInstance.contentInputs.set({ images: imageFiles });

      modalRef.closed.subscribe((cropped: File[]) => {
        if (cropped?.length) {
          this.handleFiles(cropped);
        }
      });
    }
  }

  private handleFiles(files: File[]) {
    if (!files?.length) return;
    this.filesToUpload.set([...files]);
    this.previews.set(files.map((file) => this.mapFileToPreview(file)));
    this.control.setValue([...this.filesToUpload()]);
  }

  private mapFileToPreview(file: File) {
    const url = URL.createObjectURL(file);
    return { type: this.detectFileType(file.type), url, name: file.name };
  }

  deleteFile(index: number) {
    const file = this.previews()[index];

    if (file?.id) {
      const modalRef = this.modalService.open(AppModalWrapperComponent, {
        backdrop: 'static',
        centered: true,
      });

      modalRef.componentInstance.title.set('Confirm Deletion');
      modalRef.componentInstance.contentComponent.set(ConfirmationModalComponent);
      modalRef.componentInstance.contentInputs.set({
        message: 'This file is already uploaded. Do you really want to delete it?',
      });

      modalRef.result.then((confirmed) => {
        if (confirmed) {
          this.previews.update((prev) => {
            const copy = [...prev];
            copy.splice(index, 1);
            return copy;
          });

          if (!this.model.image_deletion) this.model.image_deletion = [file.id];
          else this.model.image_deletion.push(file.id);

          if (this.currentIndex >= this.previews().length) {
            this.currentIndex = this.previews().length - 1;
          }
        }
      });
    } else {
      this.previews.update((prev) => {
        const copy = [...prev];
        copy.splice(index, 1);
        return copy;
      });

      const files = this.filesToUpload();
      files.splice(index, 1);
      this.filesToUpload.set(files);
      this.control.setValue(files);

      if (this.currentIndex >= this.previews().length) {
        this.currentIndex = this.previews().length - 1;
      }
    }
  }

  private extractName(path: string): string {
    return path.split('/').pop() || path;
  }

  get fileNames(): string {
    const value = this.control.value;
    if (Array.isArray(value) && value.length > 0) {
      return value
        .map((f: File | FileModel | string) =>
          f instanceof File
            ? f.name
            : typeof f === 'string'
            ? f
            : (f as FileModel).file_path.split('/').pop() || ''
        )
        .join(', ');
    }
    return this.props.placeholder ? (this.props.placeholder as string) : 'No files selected';
  }
}
