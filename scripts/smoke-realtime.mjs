import { io } from 'socket.io-client';

const apiBase = 'http://localhost:3000';
const usernameSuffix = Math.floor(Math.random() * 9000 + 1000);

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, options);
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(`${path} failed: ${response.status} ${JSON.stringify(data)}`);
  }

  return data;
}

async function main() {
  const creator = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `creator${usernameSuffix}@example.com`,
      username: `creator${usernameSuffix}`,
      password: 'Naughtybox123!',
    }),
  });

  await request('/creator/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${creator.token}`,
    },
    body: JSON.stringify({
      displayName: `Creator ${usernameSuffix}`,
      slug: `creator-room-${usernameSuffix}`,
      bio: 'Realtime smoke creator',
      tags: ['smoke', 'chat'],
    }),
  });

  await request('/creator/room', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${creator.token}`,
    },
    body: JSON.stringify({
      title: 'Realtime Smoke Room',
      description: 'Used by websocket smoke validation',
      tags: ['smoke', 'wallet'],
    }),
  });

  const viewer = await request('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `viewer${usernameSuffix}@example.com`,
      username: `viewer${usernameSuffix}`,
      password: 'Naughtybox123!',
    }),
  });

  const walletBefore = await request('/wallet/dev-credit', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${viewer.token}`,
    },
  });

  const messageBody = `smoke message ${usernameSuffix}`;
  const roomSlug = `creator-room-${usernameSuffix}`;

  await new Promise((resolve, reject) => {
    const socket = io('http://localhost:4200', {
      auth: { token: viewer.token },
      transports: ['websocket'],
    });

    const timer = setTimeout(() => {
      socket.disconnect();
      reject(new Error('Timed out waiting for realtime chat.'));
    }, 10000);

    socket.on('connect', () => {
      socket.emit('chat:join', roomSlug);
      setTimeout(() => {
        socket.emit('chat:message', {
          roomSlug,
          body: messageBody,
        });
      }, 300);
    });

    socket.on('chat:message', (message) => {
      if (message.body === messageBody) {
        clearTimeout(timer);
        socket.disconnect();
        resolve(message);
      }
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timer);
      socket.disconnect();
      reject(error);
    });
  });

  const history = await request(`/chat/${roomSlug}`);
  const tipResult = await request('/wallet/tip', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${viewer.token}`,
    },
    body: JSON.stringify({
      roomSlug,
      amount: 25,
      note: 'Realtime smoke tip',
    }),
  });

  const creatorWallet = await request('/wallet', {
    headers: {
      Authorization: `Bearer ${creator.token}`,
    },
  });

  const summary = {
    walletBefore: walletBefore.balance,
    viewerBalanceAfterTip: tipResult.balance,
    creatorBalanceAfterTip: creatorWallet.balance,
    chatMessages: history.length,
    roomSlug,
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
