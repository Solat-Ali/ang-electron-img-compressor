import {
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { ElectronService } from '../core/services';
import { BehaviorSubject, map, of } from 'rxjs';
import { NgZone } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  electronService = inject(ElectronService);
  ngZone = inject(NgZone);
  cdr = inject(ChangeDetectorRef);

  filePaths: string[] = [];

  @ViewChild('fileCtrl', { static: false }) fileCtrl!: ElementRef;
  loading$ = new BehaviorSubject<boolean>(false);

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('HomeComponent INIT');
  }

  public onFileChange(fileChangeEvent: Event) {
    if (this.electronService.isElectron) {
      //console.log('File change event: ', fileChangeEvent);
      const files = (fileChangeEvent?.target as any)?.files as FileList;
      this.filePaths = Array.from(files).map((file) => file.path);
    }

    //else {
    //console.log('Sorry, you are in web...');
    //}
  }

  public reset() {
    this.filePaths = [];
    (this.fileCtrl.nativeElement as any).files = null;
  }

  compress() {
    if (this.electronService.isElectron) {
      //console.log(this.filePaths);

      this.loading$.next(true);
      this.electronService.ipcRenderer.send('compress-images', this.filePaths);  

      //this.electronService.ipcRenderer.send('compress-images', this.filePaths);

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

      // this.ngZone.run(() => {
      //   this.electronService.ipcRenderer.once(
      //     'compress-images-response',
      //     (event: any, response: any) => {
      //       console.log('Response from IPC: ', response);
      //       if (response.success) {
      //         console.log('Compression successful:', response.data);
      //       } else {
      //         console.error('Compression failed:', response.error);
      //       }

      //       this.loading$.next(false);
      //       this.cdr.detectChanges();
      //     }
      //   );
      // });
    }
  }
}
