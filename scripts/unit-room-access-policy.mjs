/**
 * Unit tests for room-access policy decisions.
 *
 * `resolveAccess` mirrors the canWatch / canChat logic in
 * RoomAccessService.getViewerAccess, extracted as a pure function so it can
 * be tested without a database.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Pure access-policy helper (mirrors RoomAccessService logic)
// ---------------------------------------------------------------------------

/**
 * @typedef {{ accessMode: 'public'|'premium'|'private', chatMode: 'registered'|'members'|'tippers' }} RoomConfig
 * @typedef {{ isOwner?: boolean, isMember?: boolean, hasPrivateAccess?: boolean, isTipper?: boolean, isAuthenticated?: boolean }} ViewerFlags
 * @typedef {{ canWatch: boolean, canChat: boolean }} AccessDecision
 */

/**
 * Resolve whether a viewer can watch and chat in a room.
 *
 * @param {RoomConfig} room
 * @param {ViewerFlags} viewer
 * @returns {AccessDecision}
 */
function resolveAccess(room, viewer) {
  const {
    isOwner = false,
    isMember = false,
    hasPrivateAccess = false,
    isTipper = false,
    isAuthenticated = false,
  } = viewer;

  const canWatch =
    room.accessMode === 'public' ||
    isOwner ||
    isMember || // covers premium rooms: members can watch
    (room.accessMode === 'private' && hasPrivateAccess);

  // Registered chat intentionally requires canWatch: users who cannot watch
  // the stream should not be allowed to participate in its chat.
  // Private access grants the same chat privileges as a member so that
  // viewers who paid for a private show entry can participate in the chat.
  const canChat =
    isOwner ||
    (room.chatMode === 'registered' && isAuthenticated && canWatch) ||
    (room.chatMode === 'members' && (isMember || hasPrivateAccess)) ||
    (room.chatMode === 'tippers' && (isMember || hasPrivateAccess || isTipper));

  return { canWatch, canChat };
}

// ---------------------------------------------------------------------------
// Tests — watch access
// ---------------------------------------------------------------------------

describe('resolveAccess – canWatch', () => {
  it('public room: anonymous viewer can watch', () => {
    const { canWatch } = resolveAccess({ accessMode: 'public', chatMode: 'registered' }, {});
    assert.equal(canWatch, true);
  });

  it('private room: anonymous viewer cannot watch', () => {
    const { canWatch } = resolveAccess({ accessMode: 'private', chatMode: 'registered' }, {});
    assert.equal(canWatch, false);
  });

  it('private room: viewer with private access can watch', () => {
    const { canWatch } = resolveAccess(
      { accessMode: 'private', chatMode: 'registered' },
      { hasPrivateAccess: true, isAuthenticated: true },
    );
    assert.equal(canWatch, true);
  });

  it('premium room: member can watch', () => {
    const { canWatch } = resolveAccess(
      { accessMode: 'premium', chatMode: 'members' },
      { isMember: true, isAuthenticated: true },
    );
    assert.equal(canWatch, true);
  });

  it('premium room: non-member cannot watch', () => {
    const { canWatch } = resolveAccess({ accessMode: 'premium', chatMode: 'members' }, { isAuthenticated: true });
    assert.equal(canWatch, false);
  });

  it('owner can always watch regardless of access mode', () => {
    for (const accessMode of /** @type {const} */ (['public', 'premium', 'private'])) {
      const { canWatch } = resolveAccess({ accessMode, chatMode: 'registered' }, { isOwner: true });
      assert.equal(canWatch, true, `owner blocked in ${accessMode} room`);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests — chat access
// ---------------------------------------------------------------------------

describe('resolveAccess – canChat', () => {
  it('registered chat: authenticated viewer in public room can chat', () => {
    const { canChat } = resolveAccess({ accessMode: 'public', chatMode: 'registered' }, { isAuthenticated: true });
    assert.equal(canChat, true);
  });

  it('registered chat: anonymous viewer cannot chat', () => {
    const { canChat } = resolveAccess({ accessMode: 'public', chatMode: 'registered' }, {});
    assert.equal(canChat, false);
  });

  it('members chat: member can chat', () => {
    const { canChat } = resolveAccess(
      { accessMode: 'public', chatMode: 'members' },
      { isMember: true, isAuthenticated: true },
    );
    assert.equal(canChat, true);
  });

  it('members chat: non-member cannot chat', () => {
    const { canChat } = resolveAccess({ accessMode: 'public', chatMode: 'members' }, { isAuthenticated: true });
    assert.equal(canChat, false);
  });

  it('tippers chat: tipper can chat', () => {
    const { canChat } = resolveAccess(
      { accessMode: 'public', chatMode: 'tippers' },
      { isTipper: true, isAuthenticated: true },
    );
    assert.equal(canChat, true);
  });

  it('tippers chat: member can also chat (higher privilege)', () => {
    const { canChat } = resolveAccess(
      { accessMode: 'public', chatMode: 'tippers' },
      { isMember: true, isAuthenticated: true },
    );
    assert.equal(canChat, true);
  });

  it('tippers chat: non-tipper non-member cannot chat', () => {
    const { canChat } = resolveAccess({ accessMode: 'public', chatMode: 'tippers' }, { isAuthenticated: true });
    assert.equal(canChat, false);
  });

  it('owner can always chat regardless of chat mode', () => {
    for (const chatMode of /** @type {const} */ (['registered', 'members', 'tippers'])) {
      const { canChat } = resolveAccess({ accessMode: 'public', chatMode }, { isOwner: true });
      assert.equal(canChat, true, `owner blocked from chat in ${chatMode} mode`);
    }
  });

  it('authenticated viewer cannot chat in a private room they cannot watch', () => {
    const { canChat } = resolveAccess({ accessMode: 'private', chatMode: 'registered' }, { isAuthenticated: true });
    assert.equal(canChat, false);
  });
});
