import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import Hls from 'hls.js';

@Component({
  selector: 'app-stream-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <ng-container *ngIf="mode === 'hls'; else webrtcPlayer">
      <video #videoEl controls autoplay muted playsinline></video>
    </ng-container>
    <ng-template #webrtcPlayer>
      <iframe
        class="stream-iframe"
        [src]="safeIframeSrc()"
        title="Directo WebRTC"
        allow="autoplay; fullscreen; picture-in-picture"
        referrerpolicy="strict-origin-when-cross-origin"
      ></iframe>
    </ng-template>
  `,
})
export class StreamPlayerComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);

  @Input({ required: true }) src = '';
  @Input() mode: 'hls' | 'webrtc' = 'hls';
  @Input() controls = true;
  @Input() muted = true;
  @ViewChild('videoEl') private videoRef?: ElementRef<HTMLVideoElement>;

  private hls?: Hls;
  private retryTimer?: ReturnType<typeof setTimeout>;
  private readonly iframeSrc = signal('');
  readonly safeIframeSrc = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(this.iframeSrc()));

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

    if (!this.src) {
      return;
    }

    if (this.mode === 'webrtc') {
      this.hls?.destroy();
      this.iframeSrc.set(this.src);
      return;
    }

    this.iframeSrc.set('');

    if (!video) {
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
    video.setAttribute('playsinline', 'true');
    if (this.muted) {
      video.setAttribute('muted', 'true');
      video.defaultMuted = true;
    } else {
      video.removeAttribute('muted');
      video.defaultMuted = false;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = this.src;
      this.tryPlay(video);
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
        this.tryPlay(video);
      });
      this.hls.on(Hls.Events.LEVEL_LOADED, () => {
        if (video.paused) {
          this.tryPlay(video);
        }
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

  private tryPlay(video: HTMLVideoElement) {
    void video.play().catch(() => {
      // Keep the player stable if autoplay is blocked; the user can still press play.
    });
  }
}
