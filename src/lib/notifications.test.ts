import assert from 'node:assert/strict';
import test from 'node:test';
import { NtfySettings, Subscription } from '../types';
import {
  millisecondsUntilNextMidnight,
  NotificationDeliveryError,
  runDueNotificationCheck,
  sendNotification,
  shouldNotifyOnDate
} from './notifications';

function subscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 1,
    name: 'Example plan',
    amount: 10,
    dueDate: '2026-08-15',
    autopay: false,
    intervalValue: 1,
    intervalUnit: 'months',
    notify: true,
    currency: 'USD',
    ...overrides
  };
}

test('shouldNotifyOnDate handles recurrence units and exclusions', () => {
  const target = new Date(2026, 7, 15);

  assert(shouldNotifyOnDate(subscription(), target));
  assert(shouldNotifyOnDate(subscription({ dueDate: '2026-08-14', intervalUnit: 'days' }), target));
  assert(shouldNotifyOnDate(subscription({ dueDate: '2026-08-08', intervalUnit: 'weeks' }), target));
  assert(shouldNotifyOnDate(subscription({ dueDate: '2026-05-15', intervalUnit: 'months' }), target));
  assert(shouldNotifyOnDate(subscription({ dueDate: '2024-08-15', intervalUnit: 'years' }), target));

  assert(!shouldNotifyOnDate(subscription({ dueDate: '2026-08-16' }), target));
  assert(!shouldNotifyOnDate(subscription({ notify: false }), target));
  assert(!shouldNotifyOnDate(subscription({ endDate: '2026-08-14' }), target));
  assert(!shouldNotifyOnDate(subscription({ intervalValue: 0 }), target));
});

test('sendNotification posts plain text to NTFY', async () => {
  let capturedUrl = '';
  let capturedBody: BodyInit | null | undefined;
  const fetchImplementation = async (input: URL | RequestInfo, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedBody = init?.body;
    return new Response(null, { status: 200 });
  };

  await sendNotification(
    { service: 'ntfy', topic: 'billing', domain: 'http://notifications.local/' },
    { title: 'Subscription Due', message: 'A payment is due' },
    fetchImplementation
  );

  assert.equal(capturedUrl, 'http://notifications.local/billing');
  assert.equal(capturedBody, 'A payment is due');
});

test('sendNotification posts JSON and authentication to Gotify', async () => {
  let capturedUrl = '';
  let capturedInit: RequestInit | undefined;
  const fetchImplementation = async (input: URL | RequestInfo, init?: RequestInit) => {
    capturedUrl = String(input);
    capturedInit = init;
    return new Response(null, { status: 200 });
  };

  await sendNotification(
    {
      service: 'gotify',
      topic: '',
      gotifyUrl: 'http://gotify.local/',
      gotifyToken: 'secret'
    },
    { title: 'Subscription Due', message: 'A payment is due', priority: 5 },
    fetchImplementation
  );

  assert.equal(capturedUrl, 'http://gotify.local/message');
  assert.equal((capturedInit?.headers as Record<string, string>)['X-Gotify-Key'], 'secret');
  assert.deepEqual(JSON.parse(String(capturedInit?.body)), {
    title: 'Subscription Due',
    message: 'A payment is due',
    priority: 5
  });
});

test('sendNotification exposes upstream rejection status', async () => {
  await assert.rejects(
    sendNotification(
      { service: 'ntfy', topic: 'billing', domain: 'http://notifications.local' },
      { title: 'Subscription Due', message: 'A payment is due' },
      async () => new Response(null, { status: 503 })
    ),
    (error: unknown) => error instanceof NotificationDeliveryError && error.status === 503
  );
});

test('runDueNotificationCheck continues after a failed delivery', async () => {
  const settings: NtfySettings = {
    service: 'ntfy',
    topic: 'billing',
    domain: 'http://notifications.local'
  };
  const delivered: string[] = [];
  const loggedErrors: unknown[] = [];

  const result = await runDueNotificationCheck(new Date(2026, 7, 15), {
    loadData: async () => ({
      settings,
      subscriptions: [
        subscription({ id: 1, name: 'Fails first' }),
        subscription({ id: 2, name: 'Still sends' }),
        subscription({ id: 3, name: 'Not due', dueDate: '2026-08-16' })
      ]
    }),
    send: async (_settings, content) => {
      if (content.message.includes('Fails first')) {
        throw new Error('delivery failed');
      }
      delivered.push(content.message);
    },
    logger: {
      info: () => undefined,
      warn: () => undefined,
      error: (...args: unknown[]) => loggedErrors.push(args)
    }
  });

  assert.deepEqual(result, { attempted: 2, sent: 1, failed: 1 });
  assert.equal(delivered.length, 1);
  assert.match(delivered[0], /Still sends/);
  assert.equal(loggedErrors.length, 1);
});

test('millisecondsUntilNextMidnight follows local daylight-saving transitions', () => {
  const previousTimezone = process.env.TZ;
  process.env.TZ = 'America/Los_Angeles';

  try {
    assert.equal(
      millisecondsUntilNextMidnight(new Date('2026-02-10T22:00:00-08:00')),
      2 * 60 * 60 * 1000
    );
    assert.equal(
      millisecondsUntilNextMidnight(new Date('2026-03-08T00:30:00-08:00')),
      22.5 * 60 * 60 * 1000
    );
  } finally {
    process.env.TZ = previousTimezone;
  }
});
