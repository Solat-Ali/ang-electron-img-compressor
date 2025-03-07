export type OutputDirectoryConfig = 'preserve' | 'newDirectory';

export const DEFAULT_OUTPUT_DIRECTORY_CONFIG: OutputDirectoryConfig = 'newDirectory';
export const DEFAULT_FILE_SUFFIX = '-compressed';

export interface ImgCompressionReq {
  filePaths: string[];
  destination: string;
  configs?: CompressionConfig;
}

export interface ImgCompressionRequest {
  filePath: string;
  originalDir?: string;
  tempDir?:string;
  destination?: string;
  overwriteFile?: boolean;
  renameWithSuffix?: string;
  config?: CompressionConfig;
}

export type CompressionConfig = PngConfig | JpegConfig;

// export interface ImgFile { 
//   fileName: string;
//   originalPath: string;
//   fileType: string;
//   originalSize: number;
// }

// export interface ImgCompressionRes extends ImgFile{
//   destinationPath?: string | null;
//   compressedSize?: number | null;
// }

// export interface CompressionConfig { 
//   pngConfig?: PngConfig;
//   jpegConfig?: JpegConfig;
// }

export interface PngConfig { 
  lossy?: boolean;
  quality?: QualityConfig;
}

export interface JpegConfig { 
  lossy?: boolean;
  quality?: QualityConfig;
}

export interface QualityConfig {
  min: number; 
  max: number;
}
