import { expect, Page, test } from '@playwright/test';

const roomSlug = 'playwright-core-loop';

const streamSummary = {
  id: 'stream-playwright-core-loop',
  slug: roomSlug,
  title: 'Playwright Core Loop',
  creatorName: 'Playwright Creator',
  description: 'Sala de prueba E2E.',
  tags: ['playwright', 'smoke'],
  isLive: false,
  currentViewers: 12,
  playbackHlsUrl: 'http://localhost:8888/playwright-core-loop/index.m3u8',
  accessMode: 'public',
  following: false,
  age: 28,
  gender: 'female',
  country: 'Spain',
  city: 'Madrid',
  categories: ['girls'],
  subcategories: ['new'],
} as const;

const baseStreamDetails = {
  ...streamSummary,
  playback: {
    hlsUrl: streamSummary.playbackHlsUrl,
    webrtcUrl: 'http://localhost:8889/playwright-core-loop/webrtc',
    preferredMode: 'hls',
    shareUrl: `http://localhost:4200/streams/${roomSlug}`,
  },
  publish: {
    rtmpUrl: 'rtmp://localhost:1935/live',
    streamKey: roomSlug,
    obsServer: 'rtmp://localhost:1935/live',
  },
  roomRules: 'Respeta el chat y evita el spam.',
  creatorProfile: {
    displayName: 'Playwright Creator',
    slug: roomSlug,
    bio: 'Creator de prueba para validar la room y el loop crítico.',
    avatarUrl: '',
    coverImageUrl: '',
    accentColor: '#159F95',
    age: 28,
    gender: 'female',
    country: 'Spain',
    city: 'Madrid',
    interestedIn: 'chat',
    relationshipStatus: 'single',
    bodyType: 'athletic',
    languages: ['es'],
    categories: ['girls'],
    subcategories: ['new'],
    instagramUrl: '',
    xUrl: '',
    onlyFansUrl: '',
    websiteUrl: '',
  },
  viewerAccess: {
    accessMode: 'public',
    chatMode: 'registered',
    privateEntryTokens: 120,
    memberMonthlyTokens: 450,
    canWatch: true,
    canChat: true,
    isMember: false,
    hasPrivateAccess: false,
    hasEventTicket: false,
    isPrivateRequester: false,
  },
  isOwnerView: false,
  goals: [],
  activeEvent: null,
  privateShowRequest: null,
  memberships: [],
} as const;

async function mockLobbyAndRoom(page: Page, states: Array<{ isLive: boolean; activeSession: { id: string; status: string } | null }>) {
  let roomStateIndex = 0;

  await page.addInitScript(() => {
    window.localStorage.setItem('naughtybox.age-confirmed', 'true');
  });

  await page.route('**/api/streams', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([streamSummary]),
    });
  });

  await page.route(`**/api/streams/${roomSlug}`, async (route) => {
    const currentState = states[Math.min(roomStateIndex, states.length - 1)];
    roomStateIndex += 1;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...baseStreamDetails,
        isLive: currentState.isLive,
        activeSession: currentState.activeSession,
      }),
    });
  });

  await page.route(`**/api/chat/${roomSlug}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: 'message-1',
          roomSlug,
          userId: 'viewer-1',
          authorName: 'Viewer Uno',
          body: 'Hola desde Playwright',
          createdAt: '2026-04-13T20:00:00.000Z',
        },
      ]),
    });
  });
}

test('viewer can enter a room from the lobby and see the room shell', async ({ page }) => {
  await mockLobbyAndRoom(page, [
    {
      isLive: false,
      activeSession: null,
    },
  ]);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Lobby en directo.' })).toBeVisible();
  await expect(page.getByTestId('lobby-grid')).toBeVisible();

  await page.getByTestId(`stream-card-${roomSlug}`).click();

  await expect(page).toHaveURL(new RegExp(`/streams/${roomSlug}$`));
  await expect(page.getByRole('heading', { name: 'Playwright Core Loop', level: 1 })).toBeVisible();
  await expect(page.getByTestId('stream-status-badge')).toBeVisible();
  await expect(page.getByTestId('stream-sidebar')).toBeVisible();
});

test('room state moves deterministically from offline to preparing and back', async ({ page }) => {
  await mockLobbyAndRoom(page, [
    {
      isLive: false,
      activeSession: null,
    },
    {
      isLive: false,
      activeSession: {
        id: 'session-preparing',
        status: 'preparing',
      },
    },
    {
      isLive: false,
      activeSession: null,
    },
  ]);

  await page.goto(`/streams/${roomSlug}`);
  await expect(page.getByRole('heading', { name: 'Playwright Core Loop', level: 1 })).toBeVisible();
  await expect(page.getByTestId('stream-state-offline')).toBeVisible();
  await expect(page.getByTestId('stream-status-badge')).toHaveText('Offline');
  await expect(page.getByTestId('stream-sidebar')).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('stream-state-preparing')).toBeVisible();
  await expect(page.getByTestId('stream-status-badge')).toHaveText('Preparando');
  await expect(page.getByTestId('stream-sidebar')).toBeVisible();

  await page.reload();
  await expect(page.getByTestId('stream-state-offline')).toBeVisible();
  await expect(page.getByTestId('stream-status-badge')).toHaveText('Offline');
});
