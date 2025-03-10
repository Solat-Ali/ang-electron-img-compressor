import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroupDirective,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DropzoneCdkModule, FileInputValidators, FileInputValue } from '@ngx-dropzone/cdk';
import { DropzoneMaterialModule } from '@ngx-dropzone/material';
import { BehaviorSubject } from 'rxjs';
import { ElectronService } from '../core/services';
import {
  DEFAULT_FORM_VALUES,
  ImgCompressionForm,
  ImgCompressionRequest,
} from '../data-access';
import { ImgCompressionService } from '../data-access/services/img-compression.service';

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatIconModule,
    MatTooltipModule,
    MatInputModule,
    FormsModule,
    ReactiveFormsModule,
    DropzoneCdkModule,
    DropzoneMaterialModule,
    MatChipsModule,
    MatCheckboxModule,
    MatSliderModule,
  ],
  providers: [ImgCompressionService],
})
export class HomeComponent {
  _electronService = inject(ElectronService);
  _compressionService = inject(ImgCompressionService);
  _cdr = inject(ChangeDetectorRef);
  _snackBar = inject(MatSnackBar);
  _fb = inject(FormBuilder);

  loading$ = new BehaviorSubject<boolean>(false);

  // variables
  showFileRename = true;
  showPreserveDir = false;
  submitted = false;

  // form group
  imgCompressionForm = this._fb.group<ImgCompressionForm>({
    droppedFiles: new FormControl<FileInputValue>(DEFAULT_FORM_VALUES.files, [
      Validators.required,
      FileInputValidators.accept('image/png'),
      FileInputValidators.maxSize(10485760) //10mb max. size limit
    ]),
    outputDirectoryConfig: new FormControl (
      DEFAULT_FORM_VALUES.outputDirectoryConfig
    ),
    outputDirectory: new FormControl(
      DEFAULT_FORM_VALUES.outputDirectory,
      Validators.required
    ),
    overwrite: new FormControl(DEFAULT_FORM_VALUES.overwrite),
    minQuality: new FormControl(DEFAULT_FORM_VALUES.minQuality),
    maxQuality: new FormControl(DEFAULT_FORM_VALUES.maxQuality),
    fileSuffix: new FormControl(DEFAULT_FORM_VALUES.fileSuffix),
  });

  constructor() {
    this.setupFormValueChangesListener();
  }

  // Getters for cleaner access
  get filesCtrl() {
    return this.imgCompressionForm.get('droppedFiles') as FormControl<FileInputValue>;
  }
  get outputDirCtrl() {
    return this.imgCompressionForm.get('outputDirectory');
  }
  get outputDirConfigCtrl() {
    return this.imgCompressionForm.get('outputDirectoryConfig');
  }
  get overwriteCtrl() {
    return this.imgCompressionForm.get('overwrite');
  }

  // Mat-Chips file preview
  get files() {
    const files = this.filesCtrl?.value;
    return files ? (Array.isArray(files) ? files : [files]) : [];
  }

  // Remove a file from the control
  remove(file: File) {
    const files = this.filesCtrl?.value;

    this.filesCtrl?.patchValue(
      Array.isArray(files) ? files.filter((f) => f !== file) : null
    );
    this.filesCtrl?.updateValueAndValidity();
  }

  // Update validators based on config value changes
  setupFormValueChangesListener() {
    this.imgCompressionForm
      .get('outputDirectoryConfig')
      ?.valueChanges.subscribe((value) => {
        this.submitted = false;
        this.showPreserveDir = value === 'preserve';
        this.outputDirCtrl?.reset('');
        if (this.showPreserveDir) {
          this.outputDirCtrl?.clearValidators();
          this.overwriteCtrl?.reset(false);
        } else {
          this.outputDirCtrl?.setValidators(Validators.required);
        }
        this.outputDirCtrl?.updateValueAndValidity();
      });
  }

  // file utils
  escapePath(filePath: string) {
    return filePath?.replace(/\\/g, '//');
  }

  getFileExt(filePath: string) {
    return filePath?.match(/(\.[^.]+)$/)?.[0] || '';
  }

  getFileNameWithoutExt(filePath: string) {
    return filePath?.match(/([^\/\\]+)(?=\.[^.]+$)/)?.[1] || '';
  }
  getFileDir(filePath: string) {
    return this.escapePath(filePath)?.replace(/(.*)\/\/[^\/]+$/, '$1');
  }

  getTempDir(filePath: string) {
    return `${this.getFileDir(filePath)}//compressed`;
  }

  compress() {
    this.submitted = true;

    if (!this.imgCompressionForm.valid) {
      return;
    }

    this.loading$.next(true);
    const preserveDir = this.outputDirConfigCtrl?.value === 'preserve';
    const quality = {
      min:
        this.imgCompressionForm.get('minQuality')?.value ??
        DEFAULT_FORM_VALUES.minQuality,
      max:
        this.imgCompressionForm.get('maxQuality')?.value ??
        DEFAULT_FORM_VALUES.maxQuality,
    };

    const compressionReqs: ImgCompressionRequest[] = this.files.map((file) => ({
      fileName: file?.name,
      fileNameOnly: this.getFileNameWithoutExt(file?.path),
      fileExt: this.getFileExt(file?.path),
      filePath: this.escapePath(file?.path),
      destination: preserveDir
        ? this.getFileDir(file?.path)
        : this.outputDirCtrl?.value ?? '',
      preserveDir: preserveDir,
      overwriteFile: this.overwriteCtrl?.value ?? false,
      tempDir: preserveDir ? this.getTempDir(file?.path) : null,
      fileSuffix:
        preserveDir && !this.overwriteCtrl?.value
          ? DEFAULT_FORM_VALUES.fileSuffix
          : null,
      qualityConfig: quality,
    }));

    this._compressionService.compressImages(compressionReqs, (evt, message) => {
      this.loading$.next(false);

      if(!message?.success){
        this._snackBar.open('Sorry, but something went wrong!', '', {
          horizontalPosition: 'right',
          verticalPosition: 'top',
          duration: 3000
        });

        console.log(message);
      }

      this._cdr.detectChanges();
    });
  }

  reset(formDirective: FormGroupDirective) {
    this.submitted = false;
    this.loading$.next(false);

    formDirective.resetForm();
    this.imgCompressionForm.reset(DEFAULT_FORM_VALUES);
    this._cdr.detectChanges();
  }

  selectDirectory() {
    this._electronService.ipcRenderer.send('select-directory');

    this._electronService.ipcRenderer.once(
      'select-directory-response',
      (evt, message) => {

        this.imgCompressionForm.controls['outputDirectory'].patchValue(
          this.escapePath(message?.selectedDirectory)
        );
        this.imgCompressionForm.controls[
          'outputDirectory'
        ].updateValueAndValidity();

        this._cdr.detectChanges();
      }
    );
  }
}
