import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { provideTranslateService } from '@ngx-translate/core';
import { FilesInput } from './files-input';

describe('FilesInput', () => {
  let fixture: ComponentFixture<FilesInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilesInput],
      providers: [provideTranslateService()],
    }).compileComponents();

    fixture = TestBed.createComponent(FilesInput);
    // FilesInput is a Formly field type; Formly normally supplies `field`.
    fixture.componentInstance.field = {
      key: 'files',
      props: {},
      formControl: new FormControl([]),
    } as FormlyFieldConfig;
    fixture.detectChanges();
  });

  it('should create with no previews', () => {
    expect(fixture.componentInstance.previews()).toEqual([]);
  });
});
