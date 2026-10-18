import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readMediaManifest } from './media-readiness.mjs';

test('a timed-out initial HLS request stays pending and the next probe can succeed', async () => {
  let requests = 0;
  const server = createServer((req, res) => {
    const respond = () => res.end('#EXTM3U\n#EXT-X-STREAM-INF:CODECS="avc1.42c015,opus"\nvideo.m3u8\n');
    if (requests++ === 0) {
      const timer = setTimeout(respond, 100);
      res.on('close', () => clearTimeout(timer));
    } else respond();
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const url = `http://127.0.0.1:${server.address().port}/index.m3u8`;
    assert.equal(await readMediaManifest(url, { timeoutMs: 10 }), '');
    assert.match(await readMediaManifest(url, { timeoutMs: 1000 }), /opus/);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('an unavailable HTTP manifest is not mistaken for readiness', async () => {
  const server = createServer((req, res) => {
    res.writeHead(503);
    res.end('Not ready');
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    assert.equal(await readMediaManifest(`http://127.0.0.1:${server.address().port}/index.m3u8`), '');
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('configuration errors remain fatal instead of being swallowed as transient readiness', async () => {
  await assert.rejects(readMediaManifest('not-a-valid-url'), TypeError);
});
