export type OutputDirectoryConfig = 'preserve' | 'newDirectory';
export const DEFAULT_OUTPUT_DIRECTORY_CONFIG: OutputDirectoryConfig = 'newDirectory';
export const DEFAULT_FILE_SUFFIX = '-compressed';
export const DEFAULT_MIN_QUALITY = 0.6;
export const DEFAULT_MAX_QUALITY = 0.8;


export interface ImgCompressionRequest {
  fileName: string;
  
  fileNameOnly: string;
  fileExt: string;
  filePath: string;
  originalDir?: string;
  tempDir?:string | null;
  destination: string;
  preserveDir?: boolean;
  overwriteFile?: boolean;
  fileSuffix?: string | null;
  renameWithSuffix?: string;
  qualityConfig?: QualityConfig;
}
export interface QualityConfig {
  min: number; 
  max: number;
}
