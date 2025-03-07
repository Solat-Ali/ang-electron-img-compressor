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
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
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
  DEFAULT_OUTPUT_DIRECTORY_CONFIG,
  ImgCompressionRequest,
} from '../data-access';
import { ImgCompressionService } from '../data-access/services/img-compression.service';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
  ],
  providers: [ImgCompressionService],
})
export class HomeComponent {
  public electronService = inject(ElectronService);
  public compressionService = inject(ImgCompressionService);
  cdr = inject(ChangeDetectorRef);
  _snackBar = inject(MatSnackBar);

  // imgFiles: ImgFile[] = [];
  // imgCompressionRes: ImgCompressionRes[] = [];
  loading$ = new BehaviorSubject<boolean>(false);

  // variables
  showFileRename = true;
  //showOutputDirectory = false;
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
    outputDirectory: new FormControl<string>('', Validators.required),
    overwrite: new FormControl<boolean>(false),
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

  get overwriteConfig() {
    return this.imgCompressionForm.get('overwriteConfig');
  }

  get files() {
    const _files = this.filesCtrl?.value;
    //console.log(_files);

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
        this.imgCompressionForm.get('overwrite')?.reset(false);
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
      outputDirectory: new FormControl<string>('', Validators.required),
      overwrite: new FormControl<boolean>(false),
    });
  }

  // table config
  // @ViewChild(MatTable) table!: MatTable<ImgFile>;
  // displayedColumns: string[] = [
  //   'fileName',
  //   'fileType',
  //   'originalSize',
  //   'compressedSize',
  // ];
  // dataSource = [...this.imgFiles];

  // onFileChange(files: ImgFile[]) {
  //   this.imgFiles = files;

  //   files.forEach((file) => {
  //     this.imgCompressionRes.push({
  //       ...file,
  //       destinationPath: null,
  //       compressedSize: null,
  //     });

  //     this.dataSource = [...this.imgFiles];
  //     this.table.renderRows();
  //   });

  //   console.log('Got dropped files: ', this.imgFiles);
  // }

  cleanDirPath(filePath: string) {
    return filePath?.replace(/\\/g, '//');
  }

  removeFileExt(filePath: string) {
    return filePath?.replace(/\.[^\\/.]+$/, '');
  }

  getOriginalDir(filePath: string) {
    filePath = this.cleanDirPath(filePath);
    return this.removeFileExt(filePath);
  }

  getTempDir(filePath: string) {
    filePath = this.getOriginalDir(filePath);
    return `${filePath}//compressed`;
  }

  compress() {
    this.submitted = true;

    //console.log('compress called: ', this.imgCompressionForm);
    if (!this.imgCompressionForm.valid) {
      return;
    }

    // this._snackBar.open('done...', 'Close', {
    //   horizontalPosition: 'right',
    //   verticalPosition: 'top',
    //   duration: 3000,
    // });

    //this.loading$.next(true);

    // const mappedPaths = this.imgFiles.map((file) =>
    //   file?.originalPath?.replace(/\\/g, '//')
    // );
    // console.log('File paths: ', mappedPaths);

    // const compressionReq: ImgCompressionReq = {
    //   filePaths: mappedPaths,
    //   destination: `D://compressed`,
    //   configs: {
    //     pngConfig: {
    //       quality: {
    //         min: 0.6,
    //         max: 0.8,
    //       },
    //     },
    //   },
    // };

    const compressionReqs: ImgCompressionRequest[] = [];

    this.files.forEach((file) => {
      compressionReqs.push({
        filePath: this.cleanDirPath(file?.path),
        originalDir: this.getOriginalDir(file?.path),
        tempDir: this.getTempDir(file?.path),
        overwriteFile: this.imgCompressionForm.get('overwrite')?.value ?? false,
        destination:
          this.imgCompressionForm.get('outputDirectoryConfig')?.value ===
          'preserve'
            ? file.path?.replace(/\.[^\\/.]+$/, '')?.replace(/\\/g, '//')
            : this.outputDirConfig?.value ?? '',
      });
    });

    // destinationPath: file.originalPath?.replace(
    //   /\.png$/,
    //   '-compressed.png'
    // ),

    console.log('Request: ', compressionReqs);

    // this.compressionService.compressImages(compressionReq, (evt, message) => {
    //   console.log('callback event: ', evt);
    //   console.log('callback message: ', message);

    //   this.loading$.next(false);
    //   this.cdr.detectChanges();
    // });

    // this.compressionService.compressionResponse$.pipe(
    //   filter((x) => !!x),
    //   tap(() => {
    //     this.loading$.next(false);
    //   })
    // );
  }

  reset() {
    this.resetForm();
    // this.dataSource = [];
    // this.table.renderRows();
  }

  // removeFile(file: ImgFile) {
  //   console.log('remove: ', file);
  // }

  onFolderChange(event: Event) {
    console.log('Folder change: ', event);
  }

  selectDirectory() {
    this.electronService.ipcRenderer.send('select-directory');

    this.electronService.ipcRenderer.once(
      'select-directory-response',
      (evt, message) => {
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
