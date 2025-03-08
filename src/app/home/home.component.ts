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
import {
  DropzoneCdkModule,
  FileInputValidators,
  FileInputValue,
} from '@ngx-dropzone/cdk';
import { DropzoneMaterialModule } from '@ngx-dropzone/material';
import { BehaviorSubject } from 'rxjs';
import { ElectronService } from '../core/services';
import {
  DEFAULT_FILE_SUFFIX,
  DEFAULT_MAX_QUALITY,
  DEFAULT_MIN_QUALITY,
  DEFAULT_OUTPUT_DIRECTORY_CONFIG,
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
  public electronService = inject(ElectronService);
  public compressionService = inject(ImgCompressionService);
  cdr = inject(ChangeDetectorRef);
  _snackBar = inject(MatSnackBar);

  loading$ = new BehaviorSubject<boolean>(false);

  // variables
  showFileRename = true;
  showPreserveDir = false;
  submitted = false;

  // form group
  fb = inject(FormBuilder);
  imgCompressionForm = this.fb.group({
    files: new FormControl<FileInputValue>(null, [
      Validators.required,
      FileInputValidators.accept('image/png'),
    ]),
    outputDirectoryConfig: new FormControl<string>(
      DEFAULT_OUTPUT_DIRECTORY_CONFIG
    ),
    outputDirectory: new FormControl<string | null>(null, Validators.required),
    overwrite: new FormControl<boolean>(false),
    minQuality: new FormControl<number>(0.6),
    maxQuality: new FormControl<number>(0.8),
    fileSuffix: new FormControl<string | null>(null),
  });

  // control getters
  get filesCtrl() {
    return this.imgCompressionForm.get('files');
  }

  get outputDir() {
    return this.imgCompressionForm.get('outputDirectory');
  }

  get outputDirConfig() {
    return this.imgCompressionForm.get('outputDirectoryConfig');
  }

  get overwrite() {
    return this.imgCompressionForm.get('overwrite');
  }

  get files() {
    const _files = this.filesCtrl?.value;
    if (!_files) return [];
    return Array.isArray(_files) ? _files : [_files];
  }

  remove(file: File) {
    if (Array.isArray(this.filesCtrl?.value)) {
      this.filesCtrl?.patchValue(
        this.filesCtrl?.value.filter((i) => i !== file)
      );
    } else {
      this.filesCtrl?.patchValue(null);
    }

    this.filesCtrl?.updateValueAndValidity();
  }

  constructor() {
    this.setupFormValueChangesListener();
  }

  setupFormValueChangesListener() {
    this.imgCompressionForm.controls[
      'outputDirectoryConfig'
    ].valueChanges.subscribe((value) => {
      this.submitted = false;

      this.showPreserveDir = value === 'preserve';
      this.outputDir?.reset('');

      if (this.showPreserveDir) {
        this.outputDir?.clearValidators();
        this.overwrite?.reset(false);
      } else {
        this.outputDir?.setValidators(Validators.required);
      }

      this.outputDir?.updateValueAndValidity();
    });
  }

  resetForm() {
    this.imgCompressionForm = this.fb.group({
      files: new FormControl<FileInputValue>(null, [
        Validators.required,
        FileInputValidators.accept('image/png'),
      ]),
      outputDirectoryConfig: new FormControl<string>(
        DEFAULT_OUTPUT_DIRECTORY_CONFIG
      ),
      outputDirectory: new FormControl<string | null>(
        null,
        Validators.required
      ),
      overwrite: new FormControl<boolean>(false),
      minQuality: new FormControl<number>(0.6),
      maxQuality: new FormControl<number>(0.8),
      fileSuffix: new FormControl<string | null>(null),
    });
  }

  cleanDirPath(filePath: string) {
    return filePath?.replace(/\\/g, '//');
  }

  getOriginalDir(filePath: string) {
    return this.cleanDirPath(filePath)?.replace(/(.*)\/\/[^\/]+$/, '$1');
  }

  getTempDir(filePath: string) {
    filePath = this.getOriginalDir(filePath);
    return `${filePath}//compressed`;
  }

  compress() {
    this.submitted = true;

    if (!this.imgCompressionForm.valid) {
      return;
    }

    this.loading$.next(true);
    const compressionReqs: ImgCompressionRequest[] = [];

    this.files.forEach((file) => {
      compressionReqs.push({
        fileName: file?.name,
        fileNameOnly: file?.name?.replace(/\.[^/.]+$/, ''),
        fileExt: '.png',
        filePath: this.cleanDirPath(file?.path),
        destination:
          this.outputDirConfig?.value === 'preserve'
            ? this.getOriginalDir(file?.path)
            : this.outputDir?.value ?? '',
        preserveDir: this.outputDirConfig?.value === 'preserve',
        overwriteFile: this.overwrite?.value ?? false,
        tempDir:
          this.outputDirConfig?.value === 'preserve'
            ? this.getTempDir(file?.path)
            : null,
        fileSuffix:
          this.outputDirConfig?.value === 'preserve' &&
          this.overwrite?.value === false
            ? DEFAULT_FILE_SUFFIX
            : null,
        qualityConfig: {
          min: this.imgCompressionForm.get('minQuality')?.value ?? DEFAULT_MIN_QUALITY,
          max: this.imgCompressionForm.get('minQuality')?.value ?? DEFAULT_MAX_QUALITY,
        },
      });
    });

    console.log('Request: ', compressionReqs);

    this.compressionService.compressImages(compressionReqs, (evt, message) => {
      console.log('callback event: ', evt);
      console.log('callback message: ', message);

      this.loading$.next(false);
      this.cdr.detectChanges();
    });
  }

  reset() {
    this.loading$.next(false);
    this.submitted = false;

    this.resetForm();
    this.imgCompressionForm.reset(this.imgCompressionForm.value);
  }

  selectDirectory() {
    this.electronService.ipcRenderer.send('select-directory');

    this.electronService.ipcRenderer.once(
      'select-directory-response',
      (evt, message) => {
        console.log(message.selectedDirectory);

        this.imgCompressionForm.controls['outputDirectory'].patchValue(
          message.selectedDirectory?.replace(/\\/g, '//')
        );
        this.imgCompressionForm.controls[
          'outputDirectory'
        ].updateValueAndValidity();
        this.cdr.detectChanges();
      }
    );
  }
}
