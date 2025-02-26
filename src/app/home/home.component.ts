import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  ViewChild,
  inject
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ElectronService } from '../core/services';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent {
  public electronService = inject(ElectronService);
  cdr = inject(ChangeDetectorRef);
  ngZone = inject(NgZone);

  filePaths: string[] = [];

  @ViewChild('fileCtrl', { static: false }) fileCtrl!: ElementRef;
  loading$ = new BehaviorSubject<boolean>(false);

  public onFileChange(fileChangeEvent: Event) {
    if (this.electronService.isElectron) {
      //console.log('File change event: ', fileChangeEvent);
      const files = (fileChangeEvent?.target as any)?.files as FileList;
      this.filePaths = Array.from(files).map((file) => file.path);
    }
  }

  public reset() {
    this.filePaths = [];
    (this.fileCtrl.nativeElement as any).files = null;
  }

  compress() {
    if (this.electronService.isElectron) {
      this.loading$.next(true);
      this.electronService.ipcRenderer.send('compress-images', this.filePaths);  

      this.electronService.ipcRenderer.once(
        'compress-images-response',
        (evt, message) => {
          console.log('Received event from IPC: ', message);

          if (message?.success) {
            console.log('Compression successful:', message?.response);
          } else {
            console.error('Compression failed:', message?.response);
          }

          //this.cdr.markForCheck();

          this.loading$.next(false);
          this.cdr.detectChanges();
        }
      );
    }
  }
}
