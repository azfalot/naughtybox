import { chromium, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';

if (process.env.NAUGHTYBOX_MEDIA_SMOKE !== '1')
  throw new Error('Set NAUGHTYBOX_MEDIA_SMOKE=1 for synthetic local media testing');
const require = createRequire(new URL('../apps/frontend/package.json', import.meta.url));
const name = `live/runtime035-${randomUUID()}`;
const suffix = process.env.CI ? '-ci' : '';
const evidencePath = (label, extension) => `evidence/runtime035-${label}${suffix}.${extension}`;
const api = 'http://127.0.0.1:9997';
const report = { syntheticDevicesOnly: true, path: name, startedAt: new Date().toISOString() };
mkdirSync('evidence', { recursive: true });
const browser = await chromium.launch({
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
});
const context = await browser.newContext({ permissions: ['camera', 'microphone'] });
await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
const publisher = await context.newPage();
const paths = async () => {
  const response = await fetch(`${api}/v3/paths/list`, { signal: AbortSignal.timeout(4000) });
  if (!response.ok) throw new Error(`Local media API returned ${response.status}`);
  return (await response.json()).items;
};
try {
  const params = new URLSearchParams({
    'video-width': '320',
    'video-height': '240',
    'video-framerate': '10',
    'video-codec': 'h264/90000',
    'audio-codec': 'opus/48000',
  });
  const response = await publisher.goto(`http://127.0.0.1:8889/${name}/publish?${params}`);
  expect(response.status()).toBe(200);
  await expect(publisher.locator('#video-codec')).toHaveValue('h264/90000');
  await expect(publisher.locator('#audio-codec')).toHaveValue('opus/48000');
  await publisher.getByRole('button', { name: 'publish', exact: true }).click();
  await expect.poll(async () => (await paths()).find((p) => p.name === name)?.ready, { timeout: 25000 }).toBe(true);
  report.livePath = (await paths()).find((p) => p.name === name);
  expect(report.livePath.source.type).toBe('webRTCSession');
  expect(report.livePath.tracks).toContain('H264');
  expect(report.livePath.tracks).toContain('Opus');
  await publisher.screenshot({ path: evidencePath('publisher', 'png') });
  const playlist = `http://127.0.0.1:8888/${name}/index.m3u8`;
  await expect
    .poll(
      async () => {
        const res = await fetch(playlist, { signal: AbortSignal.timeout(4000) });
        if (!res.ok) return '';
        return res.text();
      },
      { timeout: 25000 },
    )
    .toContain('opus');
  const viewer = await context.newPage();
  await viewer.goto('http://127.0.0.1:8889/');
  await viewer.setContent('<video id="playback" autoplay muted playsinline controls></video>');
  await viewer.addScriptTag({ path: require.resolve('hls.js') });
  await viewer.evaluate((url) => {
    const video = document.querySelector('video');
    const hls = new window.Hls();
    hls.attachMedia(video);
    hls.loadSource(url);
    hls.on(window.Hls.Events.MANIFEST_PARSED, () => video.play());
  }, playlist);
  await expect
    .poll(
      () => viewer.locator('video').evaluate((video) => ({ width: video.videoWidth, playing: video.currentTime > 0 })),
      { timeout: 25000 },
    )
    .toEqual({ width: 320, playing: true });
  report.viewer = await viewer
    .locator('video')
    .evaluate((video) => ({ width: video.videoWidth, height: video.videoHeight, currentTime: video.currentTime }));
  report.playlist = await (await fetch(playlist)).text();
  await viewer.screenshot({ path: evidencePath('viewer', 'png') });
  await publisher.evaluate(() => window.dispatchEvent(new Event('beforeunload')));
  await publisher.close({ runBeforeUnload: true });
  await expect
    .poll(async () => (await paths()).find((p) => p.name === name)?.ready ?? false, { timeout: 20000 })
    .toBe(false);
  report.stopped = true;
  report.status = 'passed';
  console.log(
    JSON.stringify({
      event: 'synthetic_media_passed',
      video: report.viewer,
      tracks: report.livePath.tracks,
      stopped: report.stopped,
    }),
  );
} catch (error) {
  report.status = 'failed';
  report.error = error.message;
  throw error;
} finally {
  report.finishedAt = new Date().toISOString();
  writeFileSync(evidencePath('media', 'json'), JSON.stringify(report, null, 2) + '\n');
  try {
    await context.tracing.stop({ path: evidencePath('media-trace', 'zip') });
  } finally {
    await browser.close();
  }
}
