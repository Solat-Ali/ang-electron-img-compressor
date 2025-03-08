import { FormControl } from '@angular/forms';
import { FileInputValue } from '@ngx-dropzone/cdk';

export interface ImgCompressionForm {
  droppedFiles: FormControl<FileInputValue>;
  outputDirectoryConfig: FormControl<OutputDirectoryConfig | null>;
  outputDirectory: FormControl<string | null>;
  overwrite: FormControl<boolean | null>;
  minQuality: FormControl<number | null>;
  maxQuality: FormControl<number | null>;
  fileSuffix: FormControl<string | null>;
}

type OutputDirectoryConfig = 'preserve' | 'newDirectory';

export const DEFAULT_FORM_VALUES = {
  files: null,
  outputDirectoryConfig: 'newDirectory' as OutputDirectoryConfig,
  outputDirectory: null,
  overwrite: false,
  minQuality: 0.6,
  maxQuality: 0.8,
  fileSuffix: '-compressed',
  tempDirSuffix: 'tmp-compressed'
};

export interface ImgCompressionRequest {
  fileName: string;
  fileNameOnly: string;
  fileExt: string;
  filePath: string;
  destination: string;
  preserveDir?: boolean;
  overwriteFile?: boolean;
  renameWithSuffix?: string;
  tempDir?: string | null;
  fileSuffix?: string | null;
  qualityConfig?: QualityConfig;
}
export interface QualityConfig {
  min: number;
  max: number;
}
