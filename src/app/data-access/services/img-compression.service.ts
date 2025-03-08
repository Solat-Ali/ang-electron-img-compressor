import { Injectable, inject } from '@angular/core';
import { ElectronService } from '../../core/services';
import { ImgCompressionRequest } from '../models';

@Injectable()
export class ImgCompressionService {
  electronService = inject(ElectronService);

  compressImages(
    compressionReqs: ImgCompressionRequest[],
    callback: (evt: any, message: any) => void
  ) {
    this.electronService.ipcRenderer.send('compress-images', compressionReqs);

    this.electronService.ipcRenderer.once(
      'compress-images-response',
      (evt, message) => callback(evt, message)
    );
   }
}
