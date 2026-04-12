import { expect, test } from '@playwright/test';

const backendBaseUrl = process.env.PLAYWRIGHT_API_BASE_URL ?? 'http://localhost:3000';
const roomSlug = 'playwright-core-loop';
const username = 'playwrightcreator';
const email = 'playwright.creator@naughtybox.local';
const password = 'Naughtybox123!';

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

  const token = registerResponse.ok()
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
      Authorization: `Bearer ${token}`,
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
      Authorization: `Bearer ${token}`,
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

test('homepage loads and room page shows a deterministic stream state', async ({ page }) => {
  await page.goto('/?section=home');
  await expect(page.getByText('Home')).toBeVisible();

  await page.goto(`/streams/${roomSlug}`);
  await expect(page.getByRole('heading', { name: 'Playwright Core Loop' })).toBeVisible();
  await expect(page.getByText(/Offline|Preparando|En directo/)).toBeVisible();
  await expect(page.getByText(/Chat en vivo/)).toBeVisible();
});
