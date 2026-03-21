import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import Hls from 'hls.js';

@Component({
  selector: 'app-stream-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <video #videoEl controls autoplay muted playsinline></video>
  `,
})
export class StreamPlayerComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input({ required: true }) src = '';
  @ViewChild('videoEl') private videoRef?: ElementRef<HTMLVideoElement>;

  private hls?: Hls;

  ngAfterViewInit() {
    this.attachSource();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['src'] && !changes['src'].firstChange) {
      this.attachSource();
    }
  }

  ngOnDestroy() {
    this.hls?.destroy();
  }

  private attachSource() {
    const video = this.videoRef?.nativeElement;

    if (!video || !this.src) {
      return;
    }

    this.hls?.destroy();

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.src;
      return;
    }

    if (Hls.isSupported()) {
      this.hls = new Hls({
        lowLatencyMode: true,
      });
      this.hls.loadSource(this.src);
      this.hls.attachMedia(video);
    }
  }
}
