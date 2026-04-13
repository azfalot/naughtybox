import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ChatMessage,
  CreatorPublicProfile,
  resolveStreamRoomPresence,
  StreamDetails,
  StreamSummary,
  WalletSummary,
} from '@naughtybox/shared-types';
import { ShowsApiService } from '../../../services/shows-api.service';
import { ToastService } from '../../../services/toast.service';
import { AuthApiService } from '../../../shared/services/auth-api.service';
import { ChatApiService } from '../../../shared/services/chat-api.service';
import { StreamsApiService } from '../../../shared/services/streams-api.service';
import { WalletApiService } from '../../../shared/services/wallet-api.service';
import { DEFAULT_COVER_GRADIENT } from '../../../theme/theme.constants';
import { StreamDetailsPanelComponent } from '../components/stream-details-panel.component';
import { StreamProfilePanelComponent } from '../components/stream-profile-panel.component';
import { StreamReportModalComponent } from '../components/stream-report-modal.component';
import { StreamSidebarComponent } from '../components/stream-sidebar.component';
import { StreamStageComponent } from '../components/stream-stage.component';
import { StreamSwitcherComponent } from '../components/stream-switcher.component';
import { DEFAULT_PROFILE, STORE_PREVIEW, StreamProfileTab, VIDEO_PREVIEW } from '../models/stream-page.models';

type Goal = NonNullable<StreamDetails['goals']>[number];
type TicketedEvent = NonNullable<StreamDetails['activeEvent']>;
type ReportReason =
  | 'creator_misconduct'
  | 'harassment'
  | 'fraud'
  | 'copyright'
  | 'dangerous_behavior'
  | 'non_consensual_content'
  | 'underage_risk'
  | 'other';

@Component({
  selector: 'app-stream-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StreamSwitcherComponent,
    StreamStageComponent,
    StreamDetailsPanelComponent,
    StreamProfilePanelComponent,
    StreamSidebarComponent,
    StreamReportModalComponent,
  ],
  template: `
    <main class="page page-wide">
      <a class="muted back-link" routerLink="/">Volver al listado</a>
      <app-stream-switcher
        [previous]="adjacentStreams().previous"
        [next]="adjacentStreams().next"
        (navigate)="goToStream($event)"
      ></app-stream-switcher>

      <section *ngIf="loading()" class="page-state">Cargando sala...</section>
      <section *ngIf="error()" class="page-state">{{ error() }}</section>

      <section *ngIf="stream()" class="stream-layout">
        <div>
          <app-stream-stage
            [stream]="stream()"
            [showPlayer]="showPlayer()"
            [showPreparingState]="showPreparingState()"
            [showEndedState]="showEndedState()"
            [showOfflineState]="showOfflineState()"
            [showAccessGate]="showAccessGate()"
            [playbackUrl]="playbackUrl()"
            [playbackMode]="playbackMode()"
            [preparingCopy]="preparingCopy()"
            [endedCopy]="endedCopy()"
            [offlineCopy]="offlineCopy()"
            [accessHeadline]="accessHeadline()"
            [accessCopy]="accessCopy()"
            [authenticated]="authApi.isAuthenticated()"
            [activeEvent]="activeEvent()"
            [showSubscribeAction]="showSubscribeAction()"
            [showBuyTicketAction]="showBuyTicketAction()"
            [showPrivateRequestAction]="showPrivateRequestAction()"
            (toggleFollow)="toggleFollow()"
            (subscribe)="subscribe()"
            (buyTicket)="buyTicket()"
            (requestPrivateShow)="requestPrivateShow()"
          ></app-stream-stage>

          <app-stream-details-panel
            [stream]="stream()"
            [profile]="publicProfile()"
            [activeGoal]="activeGoal()"
            [queuedGoals]="queuedGoals()"
            [activeEvent]="activeEvent()"
            [privateRequest]="privateRequest()"
            [remainingGoalTokens]="remainingGoalTokens()"
            [goalProgressPercent]="goalProgressPercent()"
            [playbackModeLabel]="playbackModeLabel()"
            [showBuyTicketAction]="showBuyTicketAction()"
            [authenticated]="authApi.isAuthenticated()"
            (openReport)="reportModalOpen.set(true)"
            (toggleFollow)="toggleFollow()"
            (contributeGoal)="contributeGoal($event)"
            (buyTicket)="buyTicket()"
          ></app-stream-details-panel>

          <app-stream-profile-panel
            [stream]="stream()"
            [profile]="publicProfile()"
            [activeTab]="profileTab()"
            [followersCount]="followersCount()"
            [profileViewsCount]="profileViewsCount()"
            [rankingScore]="rankingScore()"
            [coverStyle]="coverStyle()"
            [avatarStyle]="avatarStyle()"
            [hasSocialLinks]="hasSocialLinks()"
            [storePreview]="storePreview()"
            [videoPreview]="videoPreview()"
            (activeTabChange)="profileTab.set($event)"
          ></app-stream-profile-panel>
        </div>

        <app-stream-sidebar
          [stream]="stream()"
          [messages]="messages()"
          [canChat]="canChat()"
          [chatModeText]="chatModeLabel(stream()!.viewerAccess?.chatMode)"
          [chatLockMessage]="chatLockMessage()"
          [authenticated]="authApi.isAuthenticated()"
          [showSubscribeAction]="showSubscribeAction()"
          [showBuyTicketAction]="showBuyTicketAction()"
          [wallet]="wallet()"
          [tipAmount]="tipAmount()"
          [notice]="notice()"
          [canModerateRoom]="canModerateRoom()"
          (sendMessage)="sendMessage($event)"
          (subscribe)="subscribe()"
          (buyTicket)="buyTicket()"
          (addDevCredit)="addDevCredit()"
          (tipAmountInput)="updateTipAmount($event)"
          (tip)="tip(tipAmount())"
          (openReport)="reportModalOpen.set(true)"
          (muteViewer)="muteViewer($event)"
          (reportViewer)="reportViewer($event)"
        ></app-stream-sidebar>
      </section>

      <app-stream-report-modal
        [open]="reportModalOpen()"
        (close)="reportModalOpen.set(false)"
        (submit)="submitReport($event)"
      ></app-stream-report-modal>
    </main>
  `,
})
export class StreamPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly streamsApi = inject(StreamsApiService);
  readonly authApi = inject(AuthApiService);
  private readonly walletApi = inject(WalletApiService);
  private readonly chatApi = inject(ChatApiService);
  private readonly showsApi = inject(ShowsApiService);
  private readonly toast = inject(ToastService);
  private routeSubscription?: { unsubscribe(): void };
  private refreshTimer?: ReturnType<typeof setInterval>;
  private activeSlug: string | null = null;

  readonly stream = signal<StreamDetails | null>(null);
  readonly streamCatalog = signal<StreamSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly notice = signal('');
  readonly messages = signal<ChatMessage[]>([]);
  readonly wallet = signal<WalletSummary | null>(null);
  readonly reportModalOpen = signal(false);
  readonly profileTab = signal<StreamProfileTab>('bio');
  readonly tipAmount = signal(25);
  readonly publicProfile = computed<CreatorPublicProfile>(() => this.stream()?.creatorProfile ?? DEFAULT_PROFILE);
  readonly followersCount = computed(() => 1800 + this.publicProfile().categories.length * 240);
  readonly profileViewsCount = computed(() => 12000 + this.publicProfile().subcategories.length * 750);
  readonly rankingScore = computed(() => 120 + this.publicProfile().languages.length * 12);
  readonly roomPresence = computed(() =>
    resolveStreamRoomPresence({
      isLoading: this.loading(),
      isLive: this.stream()?.isLive,
      activeSessionStatus: this.stream()?.activeSession?.status ?? null,
    }),
  );
  readonly canWatch = computed(() => this.stream()?.viewerAccess?.canWatch ?? true);
  readonly showPreparingState = computed(() => this.roomPresence() === 'preparing');
  readonly showEndedState = computed(() => this.roomPresence() === 'ended');
  readonly showOfflineState = computed(() => this.roomPresence() === 'offline');
  readonly showAccessGate = computed(() => this.roomPresence() === 'live' && !this.canWatch());
  readonly showPlayer = computed(() => this.roomPresence() === 'live' && this.canWatch());
  // canChat requires a confirmed live session — roomPresence() already encodes isLive + activeSession
  readonly canChat = computed(() =>
    this.roomPresence() === 'live' && Boolean(this.stream()?.viewerAccess?.canChat),
  );
  readonly canModerateRoom = computed(() => Boolean(this.stream()?.isOwnerView));
  readonly playbackMode = computed<'hls' | 'webrtc'>(() => this.stream()?.playback.preferredMode ?? 'hls');
  readonly playbackUrl = computed(() =>
    this.playbackMode() === 'webrtc'
      ? (this.stream()?.playback.webrtcUrl ?? '')
      : (this.stream()?.playback.hlsUrl ?? ''),
  );
  readonly activeGoal = computed<Goal | null>(
    () => this.stream()?.goals?.find((goal) => goal.status === 'active') ?? null,
  );
  readonly queuedGoals = computed<Goal[]>(() => this.stream()?.goals?.filter((goal) => goal.status === 'queued') ?? []);
  readonly activeEvent = computed<TicketedEvent | null>(() => this.stream()?.activeEvent ?? null);
  readonly privateRequest = computed(() => this.stream()?.privateShowRequest ?? null);
  readonly adjacentStreams = computed(() => {
    const current = this.stream();
    const catalog = this.streamCatalog();
    if (!current || !catalog.length) {
      return { previous: null as StreamSummary | null, next: null as StreamSummary | null };
    }

    const currentIndex = catalog.findIndex((item) => item.slug === current.slug);
    return {
      previous: currentIndex > 0 ? catalog[currentIndex - 1] : null,
      next: currentIndex >= 0 && currentIndex < catalog.length - 1 ? catalog[currentIndex + 1] : null,
    };
  });
  readonly goalProgressPercent = computed(() => {
    const goal = this.activeGoal();
    if (!goal || !goal.targetTokens) return 0;
    return Math.max(0, Math.min(100, Math.round((goal.currentTokens / goal.targetTokens) * 100)));
  });
  readonly remainingGoalTokens = computed(() => {
    const goal = this.activeGoal();
    if (!goal) return 0;
    return Math.max(0, goal.targetTokens - goal.currentTokens);
  });

  async ngOnInit() {
    this.routeSubscription = this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');

      if (!slug) {
        this.activeSlug = null;
        this.stopRealtime();
        this.stream.set(null);
        this.error.set('Sala no valida.');
        this.loading.set(false);
        return;
      }

      if (slug === this.activeSlug) {
        return;
      }

      this.activeSlug = slug;
      void this.initializeRoom(slug);
    });
  }

  ngOnDestroy() {
    this.routeSubscription?.unsubscribe();
    this.stopRealtime();
  }

  coverStyle() {
    const cover = this.publicProfile().coverImageUrl;
    if (!cover) return DEFAULT_COVER_GRADIENT;
    if (cover.startsWith('linear-gradient') || cover.startsWith('radial-gradient')) return cover;
    return `linear-gradient(135deg, rgba(6, 17, 19, 0.26), rgba(6, 17, 19, 0.58)), center / cover no-repeat url("${cover}")`;
  }

  avatarStyle() {
    return this.publicProfile().avatarUrl ? `url('${this.publicProfile().avatarUrl}')` : 'none';
  }

  accessHeadline() {
    const mode = this.stream()?.viewerAccess?.accessMode;
    if (mode === 'private_exclusive') return 'Private show exclusivo';
    if (mode === 'ticketed_event') return 'Evento con ticket';
    if (mode === 'premium_membership_required') return 'Contenido premium';
    return 'Acceso restringido';
  }

  endedCopy() {
    const profile = this.publicProfile();
    return `La emisión de ${profile.displayName} ha terminado. Cuando vuelva a emitir, la sala se activará automáticamente.`;
  }

  offlineCopy() {
    const profile = this.publicProfile();
    if (profile.bio) {
      return `La sala esta desconectada. Mientras vuelve al aire, puedes revisar el perfil, la bio y los enlaces de ${profile.displayName}.`;
    }
    return 'La sala esta desconectada. Cuando vuelva a emitir, aqui aparecera el directo y se activara el chat de la sesion.';
  }

  preparingCopy() {
    const profile = this.publicProfile();
    return `La cabina de ${profile.displayName} ya ha abierto sesion, pero todavia no hay playback publico confirmado. En cuanto llegue senal real, la sala pasara a En directo.`;
  }

  accessCopy() {
    const access = this.stream()?.viewerAccess;
    const event = this.activeEvent();
    if (!access) return 'Necesitas acceso para entrar en esta sala.';
    if (access.accessMode === 'private_exclusive') {
      return `El private es 1:1 y solo entra quien lo solicita y la creadora acepta. Tarifa base ${access.privateEntryTokens} NC/min.`;
    }
    if (access.accessMode === 'ticketed_event') {
      return `Este evento se desbloquea con ticket de ${event?.ticketPrice ?? 0} NC o por membresia si el creador lo permite.`;
    }
    if (access.accessMode === 'premium_membership_required') {
      return `Suscribete por ${access.memberMonthlyTokens} NC al mes para ver y chatear con acceso premium.`;
    }
    return 'Acceso protegido.';
  }

  chatLockMessage() {
    const presence = this.roomPresence();
    if (presence !== 'live') {
      return 'El chat solo se abre cuando la creadora esta en directo y se reinicia con cada nueva sesion.';
    }
    if (!this.authApi.isAuthenticated()) {
      return 'Entra con tu cuenta para acceder al chat y a los permisos de la sala.';
    }
    if (this.stream()?.roomRules && !this.stream()?.viewerAccess?.canChat) {
      return 'Antes de escribir debes aceptar las reglas configuradas para esta sala.';
    }
    return `Este chat está configurado para ${this.chatModeLabel(this.stream()?.viewerAccess?.chatMode)}.`;
  }

  // Access gate actions — only meaningful when the stream is actually live.
  // Returning false for preparing/ended/offline prevents stale access UI.
  readonly showSubscribeAction = computed(
    () =>
      this.roomPresence() === 'live' &&
      this.stream()?.viewerAccess?.accessMode === 'premium_membership_required',
  );

  readonly showBuyTicketAction = computed(() => {
    if (this.roomPresence() !== 'live') return false;
    const access = this.stream()?.viewerAccess;
    const event = this.activeEvent();
    return Boolean(event && access?.accessMode === 'ticketed_event' && !access?.hasEventTicket && !access?.isMember);
  });

  readonly showPrivateRequestAction = computed(() => {
    if (this.roomPresence() !== 'live') return false;
    const access = this.stream()?.viewerAccess;
    return Boolean(
      this.authApi.isAuthenticated() &&
        access?.accessMode === 'private_exclusive' &&
        !access?.isPrivateRequester &&
        this.authApi.user()?.role !== 'creator',
    );
  });

  chatModeLabel(mode?: string) {
    if (mode === 'members') return 'members';
    if (mode === 'tippers') return 'tippers';
    if (mode === 'ticket_holders') return 'ticket holders';
    if (mode === 'private_only') return 'private only';
    return 'registered';
  }

  playbackModeLabel() {
    return this.playbackMode() === 'webrtc' ? 'WebRTC' : 'HLS';
  }

  storePreview() {
    return STORE_PREVIEW;
  }

  videoPreview() {
    return VIDEO_PREVIEW;
  }

  hasSocialLinks() {
    return Boolean(
      this.publicProfile().instagramUrl ||
      this.publicProfile().xUrl ||
      this.publicProfile().onlyFansUrl ||
      this.publicProfile().websiteUrl,
    );
  }

  async goToStream(slug: string) {
    await this.router.navigate(['/streams', slug]);
  }

  async sendMessage(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem('message') as HTMLInputElement | null;
    if (!input || !input.value.trim() || !this.stream() || !this.canChat()) return;
    this.chatApi.sendMessage(this.stream()!.slug, input.value.trim());
    input.value = '';
  }

  async addDevCredit() {
    try {
      this.wallet.set(await this.walletApi.addDevCredit());
      this.notice.set('Saldo de prueba recargado.');
      this.toast.success('Saldo de prueba recargado.');
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo recargar.');
      this.toast.error(this.notice());
    }
  }

  async tip(amount: number) {
    if (!this.stream()) return;
    try {
      this.wallet.set(await this.walletApi.tipCreator(this.stream()!.slug, amount));
      await this.loadStream(this.stream()!.slug, false);
      this.notice.set(`Propina enviada: ${amount} NC.`);
      this.toast.success(`Tip enviado: ${amount} NC.`);
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo enviar la propina.');
      this.toast.error(this.notice());
    }
  }

  updateTipAmount(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const amount = Number(input?.value || 0);
    this.tipAmount.set(Math.max(1, amount || 1));
  }

  async contributeGoal(amount: number) {
    const goal = this.activeGoal();
    const roomSlug = this.stream()?.slug;
    if (!goal || !roomSlug) return;
    try {
      await this.showsApi.contributeToGoal(roomSlug, amount);
      await this.loadStream(roomSlug, false);
      await this.loadWallet();
      this.notice.set(`Has contribuido ${amount} NC a la goal activa.`);
      this.toast.success(`Goal +${amount} NC.`);
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo contribuir a la goal.');
      this.toast.error(this.notice());
    }
  }

  async toggleFollow() {
    if (!this.stream()) return;
    if (!this.authApi.isAuthenticated()) {
      this.notice.set('Entra con tu cuenta para seguir a este creador.');
      return;
    }
    try {
      const result = await this.streamsApi.toggleFollow(this.stream()!.slug);
      this.stream.update((current) => (current ? { ...current, following: result.following } : current));
      this.notice.set(result.following ? 'Ahora sigues a este creador.' : 'Has dejado de seguir a este creador.');
      this.toast.success(this.notice());
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo actualizar el follow.');
      this.toast.error(this.notice());
    }
  }

  async subscribe() {
    if (!this.stream()) return;
    try {
      const access = await this.streamsApi.subscribe(this.stream()!.slug);
      this.stream.update((current) => (current ? { ...current, viewerAccess: access } : current));
      await this.loadWallet();
      this.notice.set('Membresia activada.');
      this.toast.success('Membresía activada.');
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo activar la membresia.');
      this.toast.error(this.notice());
    }
  }

  async buyTicket() {
    const event = this.activeEvent();
    const roomSlug = this.stream()?.slug;
    if (!event || !roomSlug) return;
    try {
      await this.showsApi.buyTicket(event.id);
      await this.loadStream(roomSlug, false);
      await this.loadWallet();
      this.notice.set('Ticket comprado. Ya puedes entrar al evento.');
      this.toast.success('Ticket comprado.');
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo comprar el ticket.');
      this.toast.error(this.notice());
    }
  }

  async requestPrivateShow() {
    const roomSlug = this.stream()?.slug;
    const access = this.stream()?.viewerAccess;
    if (!roomSlug || !access) return;
    try {
      await this.showsApi.requestPrivateShow(roomSlug, {
        tokensPerMinute: access.privateEntryTokens,
      });
      await this.loadStream(roomSlug, false);
      this.notice.set('Solicitud de private enviada.');
      this.toast.success('Solicitud de private enviada.');
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo pedir el private.');
      this.toast.error(this.notice());
    }
  }

  async submitReport(event: Event) {
    event.preventDefault();
    if (!this.stream()) return;
    if (!this.authApi.isAuthenticated()) {
      this.notice.set('Necesitas iniciar sesion para reportar.');
      return;
    }

    const form = event.target as HTMLFormElement;
    const reason = (form.elements.namedItem('reason') as HTMLSelectElement)?.value as ReportReason;
    const details = (form.elements.namedItem('details') as HTMLTextAreaElement)?.value ?? '';

    try {
      await this.showsApi.submitReport({
        targetType: 'room',
        targetId: this.stream()!.slug,
        roomSlug: this.stream()!.slug,
        sessionId: this.stream()!.activeSession?.id,
        reason,
        details,
      });
      form.reset();
      this.reportModalOpen.set(false);
      this.notice.set('Reporte enviado al equipo de Trust & Safety.');
      this.toast.success('Reporte enviado.');
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo enviar el reporte.');
      this.toast.error(this.notice());
    }
  }

  async muteViewer(event: Event) {
    event.preventDefault();
    const roomSlug = this.stream()?.slug;
    if (!roomSlug) return;

    const form = event.target as HTMLFormElement;
    const targetUsername = (form.elements.namedItem('targetUsername') as HTMLInputElement)?.value ?? '';
    const reason = (form.elements.namedItem('reason') as HTMLInputElement)?.value ?? '';
    const durationHours = Number((form.elements.namedItem('durationHours') as HTMLInputElement)?.value || 24);

    try {
      await this.showsApi.creatorMuteViewer({ roomSlug, targetUsername, reason, durationHours });
      form.reset();
      this.notice.set(`Usuario ${targetUsername} silenciado.`);
      this.toast.success(`Silenciado: ${targetUsername}`);
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo silenciar al usuario.');
      this.toast.error(this.notice());
    }
  }

  async reportViewer(event: Event) {
    event.preventDefault();
    const roomSlug = this.stream()?.slug;
    if (!roomSlug) return;

    const form = event.target as HTMLFormElement;
    const targetUsername = (form.elements.namedItem('targetUsername') as HTMLInputElement)?.value ?? '';
    const reason = (form.elements.namedItem('reason') as HTMLSelectElement)?.value as ReportReason;
    const details = (form.elements.namedItem('details') as HTMLTextAreaElement)?.value ?? '';

    try {
      await this.showsApi.creatorReportViewer({ roomSlug, targetUsername, reason, details });
      form.reset();
      this.notice.set(`Reporte sobre ${targetUsername} enviado.`);
      this.toast.success(`Reporte enviado sobre ${targetUsername}`);
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudo reportar al usuario.');
      this.toast.error(this.notice());
    }
  }

  private async loadStream(slug: string, showLoader = true) {
    if (showLoader) this.loading.set(true);
    this.stream.set(await this.streamsApi.getStream(slug));
    this.error.set('');
    if (showLoader) this.loading.set(false);
  }

  private async loadChat(slug: string) {
    this.messages.set(await this.chatApi.getHistory(slug));
  }

  private async loadCatalog() {
    this.streamCatalog.set(await this.streamsApi.listStreams());
  }

  private async loadWallet() {
    this.wallet.set(await this.walletApi.getWallet());
  }

  private connectChat(slug: string) {
    this.chatApi.connect(slug, {
      onHistory: (messages) => this.messages.set(messages),
      onMessage: (message) => {
        this.messages.update((current) => [...current, message].slice(-40));
      },
    });
  }

  private async initializeRoom(slug: string) {
    this.stopRealtime();
    this.loading.set(true);
    this.error.set('');

    try {
      // Critical path: stream details must succeed.
      await this.loadStream(slug);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo cargar la sala.');
      this.loading.set(false);
      return;
    }

    // Non-critical loads — failures here don't block the stream room.
    void this.loadCatalog().catch(() => undefined);
    void this.loadChat(slug).catch(() => undefined);

    if (this.authApi.isAuthenticated()) {
      void this.loadWallet().catch(() => undefined);
      this.connectChat(slug);
    } else {
      this.wallet.set(null);
    }

    this.refreshTimer = setInterval(() => {
      void this.loadStream(slug, false).catch(() => undefined);
      void this.loadChat(slug).catch(() => undefined);
    }, 8000);

    this.loading.set(false);
  }

  private stopRealtime() {
    this.chatApi.disconnect();
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }
  }
}
