import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  ChatMessage,
  CreatorPublicProfile,
  Goal,
  ReportReason,
  StreamDetails,
  StreamSummary,
  TicketedEvent,
  WalletSummary,
  resolveStreamRoomPresence,
} from '@naughtybox/shared-types';
import { AuthApiService } from '../../../services/auth-api.service';
import { ChatApiService } from '../../../services/chat-api.service';
import { ShowsApiService } from '../../../services/shows-api.service';
import { StreamsApiService } from '../../../services/streams-api.service';
import { ToastService } from '../../../services/toast.service';
import { WalletApiService } from '../../../services/wallet-api.service';
import { DEFAULT_COVER_GRADIENT } from '../../../theme/theme.constants';
import { StreamDetailsPanelComponent } from '../components/stream-details-panel.component';
import { StreamProfilePanelComponent } from '../components/stream-profile-panel.component';
import { StreamReportModalComponent } from '../components/stream-report-modal.component';
import { StreamSidebarComponent } from '../components/stream-sidebar.component';
import { StreamStageComponent } from '../components/stream-stage.component';
import { StreamSwitcherComponent } from '../components/stream-switcher.component';
import { DEFAULT_PROFILE, STORE_PREVIEW, StreamProfileTab, VIDEO_PREVIEW } from '../models/stream-page.models';

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
            [showOfflineState]="showOfflineState()"
            [showAccessGate]="showAccessGate()"
            [playbackUrl]="playbackUrl()"
            [playbackMode]="playbackMode()"
            [preparingCopy]="preparingCopy()"
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
          (acceptRoomRules)="acceptRoomRules()"
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
  private refreshTimer?: ReturnType<typeof setInterval>;

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
  readonly canWatch = computed(() => this.stream()?.viewerAccess?.canWatch ?? true);
  readonly roomPresence = computed(() =>
    resolveStreamRoomPresence({
      isLoading: this.loading(),
      isLive: this.stream()?.isLive,
      activeSessionStatus: this.stream()?.activeSession?.status ?? null,
    }),
  );
  readonly showPreparingState = computed(() => this.roomPresence() === 'preparing');
  readonly showOfflineState = computed(() => this.roomPresence() === 'offline');
  readonly showAccessGate = computed(() => this.roomPresence() === 'live' && !this.canWatch());
  readonly showPlayer = computed(() => this.roomPresence() === 'live' && this.canWatch());
  readonly canChat = computed(() =>
    Boolean(this.stream()?.isLive && this.stream()?.activeSession && this.stream()?.viewerAccess?.canChat),
  );
  readonly canModerateRoom = computed(() => Boolean(this.stream()?.isOwnerView));
  readonly playbackMode = computed<'hls' | 'webrtc'>(() => this.stream()?.playback.preferredMode ?? 'hls');
  readonly playbackUrl = computed(() =>
    this.playbackMode() === 'webrtc'
      ? (this.stream()?.playback.webrtcUrl ?? '')
      : (this.stream()?.playback.hlsUrl ?? ''),
  );
  readonly activeGoal = computed<Goal | null>(
    () => this.stream()?.goals.find((goal) => goal.status === 'active') ?? null,
  );
  readonly queuedGoals = computed<Goal[]>(() => this.stream()?.goals.filter((goal) => goal.status === 'queued') ?? []);
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
    const slug = this.route.snapshot.paramMap.get('slug');
    if (!slug) {
      this.error.set('Sala no valida.');
      this.loading.set(false);
      return;
    }

    try {
      await this.loadStream(slug);
      await this.loadCatalog();
      await this.loadChat(slug);
      if (this.authApi.isAuthenticated()) {
        await this.loadWallet();
        this.connectChat(slug);
      }
      this.refreshTimer = setInterval(() => {
        void this.loadStream(slug, false);
        void this.loadChat(slug);
      }, 8000);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'No se pudo cargar la sala.');
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    this.chatApi.disconnect();
    if (this.refreshTimer) clearInterval(this.refreshTimer);
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

  preparingCopy() {
    const profile = this.publicProfile();
    return `La cabina de ${profile.displayName} ya ha abierto sesion, pero todavia no hay playback publico confirmado. En cuanto llegue senal real, la sala pasara a En directo.`;
  }

  offlineCopy() {
    const profile = this.publicProfile();
    if (profile.bio) {
      return `La sala esta desconectada. Mientras vuelve al aire, puedes revisar el perfil, la bio y los enlaces de ${profile.displayName}.`;
    }
    return 'La sala esta desconectada. Cuando vuelva a emitir, aqui aparecera el directo y se activara el chat de la sesion.';
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
    const access = this.stream()?.viewerAccess;
    if (!this.stream()?.isLive || !this.stream()?.activeSession) {
      return 'El chat solo se abre cuando la creadora esta en directo y se reinicia con cada nueva sesion.';
    }
    if (!this.authApi.isAuthenticated()) {
      return 'Entra con tu cuenta para acceder al chat y a los permisos de la sala.';
    }
    if (this.stream()?.roomRules && !this.stream()?.viewerAccess?.canChat) {
      return 'Antes de escribir debes aceptar las reglas configuradas para esta sala.';
    }
    return `Este chat está configurado para ${this.chatModeLabel(access?.chatMode)}.`;
  }

  showSubscribeAction() {
    return this.stream()?.viewerAccess?.accessMode === 'premium_membership_required';
  }

  showBuyTicketAction() {
    const access = this.stream()?.viewerAccess;
    const event = this.activeEvent();
    return Boolean(event && access?.accessMode === 'ticketed_event' && !access?.hasEventTicket && !access?.isMember);
  }

  showPrivateRequestAction() {
    const access = this.stream()?.viewerAccess;
    return Boolean(
      this.authApi.isAuthenticated() &&
      access?.accessMode === 'private_exclusive' &&
      !access?.isPrivateRequester &&
      this.authApi.user()?.role !== 'creator',
    );
  }

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

  async acceptRoomRules() {
    if (!this.stream()) return;
    try {
      const access = await this.streamsApi.acceptRoomRules(this.stream()!.slug);
      this.stream.update((current) => (current ? { ...current, viewerAccess: access } : current));
      this.notice.set('Has aceptado las reglas de la sala.');
      this.toast.success('Reglas aceptadas.');
    } catch (error) {
      this.notice.set(error instanceof Error ? error.message : 'No se pudieron aceptar las reglas.');
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
}
