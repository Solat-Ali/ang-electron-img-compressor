import { Injectable, inject } from '@angular/core';
import { ElectronService } from '../../core/services';
import { ImgCompressionReq } from '../models';

@Injectable()
export class ImgCompressionService {
  electronService = inject(ElectronService);

  compressImages(
    compressionReq: ImgCompressionReq,
    callback: (evt: any, message: any) => void
  ) {
    this.electronService.ipcRenderer.send('compress-images', compressionReq);

    this.electronService.ipcRenderer.once(
      'compress-images-response',
      (evt, message) => callback(evt, message)
    );
   }
}
