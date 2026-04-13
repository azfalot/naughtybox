import test from 'node:test';
import assert from 'node:assert/strict';
import sharedTypes from '../packages/shared-types/dist/index.js';

const { resolveStreamRoomPresence } = sharedTypes;

test('loading wins over transient stream signals', () => {
  assert.equal(
    resolveStreamRoomPresence({
      isLoading: true,
      isLive: true,
      activeSessionStatus: 'preparing',
    }),
    'loading',
  );
});

test('live wins once playback is confirmed', () => {
  assert.equal(
    resolveStreamRoomPresence({
      isLive: true,
      activeSessionStatus: 'preparing',
    }),
    'live',
  );
});

test('preparing is exposed when browser booth opened without public playback yet', () => {
  assert.equal(
    resolveStreamRoomPresence({
      isLive: false,
      activeSessionStatus: 'preparing',
    }),
    'preparing',
  );
});

test('offline is returned when no live or preparing session exists', () => {
  assert.equal(
    resolveStreamRoomPresence({
      isLive: false,
      activeSessionStatus: null,
    }),
    'offline',
  );
});
