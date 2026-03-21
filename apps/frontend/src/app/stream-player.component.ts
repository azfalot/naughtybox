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
  @Input() controls = true;
  @Input() muted = true;
  @ViewChild('videoEl') private videoRef?: ElementRef<HTMLVideoElement>;

  private hls?: Hls;
  private retryTimer?: ReturnType<typeof setTimeout>;

  ngAfterViewInit() {
    this.attachSource();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['src'] && !changes['src'].firstChange) {
      this.attachSource();
    }
  }

  ngOnDestroy() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    this.hls?.destroy();
  }

  private attachSource() {
    const video = this.videoRef?.nativeElement;

    if (!video || !this.src) {
      return;
    }

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = undefined;
    }

    this.hls?.destroy();
    video.muted = this.muted;
    video.controls = this.controls;
    video.autoplay = true;
    video.playsInline = true;
    video.preload = 'auto';

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.src;
      void video.play().catch(() => undefined);
      return;
    }

    if (Hls.isSupported()) {
      this.hls = new Hls({
        lowLatencyMode: false,
        backBufferLength: 90,
        liveSyncDurationCount: 3,
        maxBufferLength: 12,
      });
      this.hls.on(Hls.Events.MANIFEST_PARSED, () => {
        void video.play().catch(() => undefined);
      });
      this.hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal) {
          return;
        }

        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          this.hls?.startLoad();
          return;
        }

        if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          this.hls?.recoverMediaError();
          return;
        }

        this.hls?.destroy();
        this.retryTimer = setTimeout(() => this.attachSource(), 1500);
      });
      this.hls.loadSource(this.src);
      this.hls.attachMedia(video);
    }
  }
}
