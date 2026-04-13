import { expect, test } from '@playwright/test';

const backendBaseUrl = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3000';
const roomSlug = 'playwright-core-loop';
const username = 'playwrightcreator';
const email = 'playwright.creator@naughtybox.local';
const password = 'Naughtybox123!';
let creatorToken = '';

test.beforeAll(async ({ playwright }) => {
  const request = await playwright.request.newContext({
    baseURL: backendBaseUrl,
  });

  const registerResponse = await request.post('/auth/register', {
    data: {
      email,
      username,
      password,
    },
  });

  creatorToken = registerResponse.ok()
    ? (await registerResponse.json()).token
    : await (async () => {
        const loginResponse = await request.post('/auth/login', {
          data: {
            emailOrUsername: username,
            password,
          },
        });

        expect(loginResponse.ok()).toBeTruthy();
        return (await loginResponse.json()).token;
      })();

  await request.put('/creator/profile', {
    headers: {
      Authorization: `Bearer ${creatorToken}`,
    },
    data: {
      displayName: 'Playwright Creator',
      slug: roomSlug,
      bio: 'Creator de prueba para validar la room y el loop crítico.',
      categories: ['girls'],
      subcategories: ['new'],
      country: 'Spain',
    },
  });

  await request.put('/creator/room', {
    headers: {
      Authorization: `Bearer ${creatorToken}`,
    },
    data: {
      title: 'Playwright Core Loop',
      description: 'Sala de prueba E2E.',
      isPublic: true,
      accessMode: 'public',
      chatMode: 'registered',
    },
  });

  await request.dispose();
});

test('room state moves deterministically from offline to preparing and back', async ({ page, playwright }) => {
  const request = await playwright.request.newContext({
    baseURL: backendBaseUrl,
    extraHTTPHeaders: {
      Authorization: `Bearer ${creatorToken}`,
    },
  });

  await page.goto(`/streams/${roomSlug}`);
  await expect(page.getByRole('heading', { name: 'Playwright Core Loop' })).toBeVisible();
  await expect(page.getByTestId('stream-state-offline')).toBeVisible();
  await expect(page.getByTestId('stream-status-badge')).toHaveText('Offline');

  const startResponse = await request.put('/creator/broadcast/start');
  expect(startResponse.ok()).toBeTruthy();

  await page.reload();
  await expect(page.getByTestId('stream-state-preparing')).toBeVisible();
  await expect(page.getByTestId('stream-status-badge')).toHaveText('Preparando');
  await expect(page.getByText(/Chat en vivo/)).toBeVisible();

  const stopResponse = await request.put('/creator/broadcast/stop');
  expect(stopResponse.ok()).toBeTruthy();

  await page.reload();
  await expect(page.getByTestId('stream-state-offline')).toBeVisible();
  await expect(page.getByTestId('stream-status-badge')).toHaveText('Offline');

  await request.dispose();
});
