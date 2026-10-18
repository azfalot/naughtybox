import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const rendered = spawnSync(
  'docker',
  ['compose', '-f', 'infra/docker/docker-compose.yml', 'config', '--format', 'json'],
  {
    cwd: root,
    encoding: 'utf8',
    timeout: 15000,
    env: { ...process.env, NAUGHTYBOX_DB_PASSWORD: 'runtime-contract-test-only' },
  },
);
assert.equal(rendered.status, 0, rendered.stderr);
const model = JSON.parse(rendered.stdout);

test('browser booth signaling and ICE media have local published ports', () => {
  const ports = model.services.mediamtx.ports;
  assert.ok(
    ports.some((p) => p.target === 8889 && Number(p.published) === 8889 && p.protocol === 'tcp'),
    'The booth iframe needs published HTTP port8889',
  );
  assert.ok(
    ports.some((p) => p.target === 8189 && Number(p.published) === 8189 && p.protocol === 'udp'),
    'WebRTC media needs published UDP port8189',
  );
  assert.ok(
    ports.every((p) => p.host_ip === '127.0.0.1'),
    'Local media endpoints must stay on loopback',
  );
});

test('local stack uses the existing PostgreSQL server and its own database', () => {
  assert.ok(!model.services.postgres, 'Do not create a PostgreSQL service');
  assert.ok(!model.volumes?.postgres_data, 'Do not create a second PostgreSQL data volume');
  assert.equal(model.services.backend.environment.DB_HOST, 'shared-postgres');
  assert.equal(model.services.backend.environment.DB_PORT, '5432');
  assert.equal(model.networks['dev-network'].external, true);
  assert.ok(Object.hasOwn(model.services.backend.networks, 'dev-network'));
  assert.ok(!model.services.backend.depends_on?.postgres);
});
