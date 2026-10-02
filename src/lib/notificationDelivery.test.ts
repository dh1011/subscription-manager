import assert from 'node:assert/strict';
import { createServer, Server } from 'node:http';
import { AddressInfo } from 'node:net';
import test from 'node:test';
import { Agent, fetch as undiciFetch } from 'undici';
import { NotificationDeliveryError, runDueNotificationCheck, sendNotification } from './notifications';
import { POST } from '../app/api/test-notification/route';

async function listen(server: Server): Promise<string> {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  return `http://localhost:${(server.address() as AddressInfo).port}`;
}
async function close(server: Server) {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
const content = { title: 'Test', message: 'Test delivery' };

test('test API and scheduled checks both deliver to a real localhost receiver', async () => {
  const received: Array<{ path?: string; body: string; token?: string }> = [];
  const server = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    received.push({ path: request.url, body, token: request.headers['x-gotify-key'] as string | undefined });
    response.end('ok');
  });
  const domain = await listen(server);
  try {
    for (const service of ['ntfy', 'gotify'] as const) {
      const settings = { service, domain, topic: 'billing', gotifyUrl: domain, gotifyToken: 'test-token' };
      const response = await POST(new Request('http://localhost/api/test-notification', {
        method: 'POST', body: JSON.stringify(settings)
      }));
      assert.equal(response.status, 200);
      const result = await runDueNotificationCheck(new Date(2026, 9, 2), {
        loadData: async () => ({ settings, subscriptions: [{
          id: 1, name: 'Due plan', amount: 10, dueDate: '2026-09-02',
          intervalValue: 1, intervalUnit: 'months', notify: true, autopay: false, currency: 'USD'
        }] }),
        logger: { info() {}, warn() {}, error() { assert.fail('Delivery should succeed'); } }
      });
      assert.deepEqual(result, { attempted: 1, sent: 1, failed: 0 });
    }
    assert.equal(received.length, 4);
    assert.equal(received[0].path, '/billing');
    assert.match(received[1].body, /Due plan.*2026-10-02/);
    assert.equal(received[2].path, '/message');
    assert.equal(received[2].token, 'test-token');
    assert.equal(JSON.parse(received[3].body).title, 'Subscription Due');
  } finally { await close(server); }
});

test('dual-stack delivery falls back from unreachable IPv6 to IPv4', async () => {
  const server = createServer((_request, response) => response.end('ok'));
  const domain = await listen(server);
  const dispatcher = new Agent({
    autoSelectFamily: true, autoSelectFamilyAttemptTimeout: 50,
    connect: {
    lookup: (_hostname, _options, callback) => {
      callback(null, [{ address: '::1', family: 6 }, { address: '127.0.0.1', family: 4 }]);
    }
  } });
  try {
    await sendNotification({ service: 'ntfy', topic: 'billing', domain }, content,
      (input, init) => undiciFetch(input, { ...init, dispatcher }));
  } finally { await dispatcher.close(); await close(server); }
});

test('a stalled receiver is aborted with a useful timeout error', async () => {
  const server = createServer(() => {});
  const domain = await listen(server);
  try {
    await assert.rejects(sendNotification({ service: 'ntfy', topic: 'billing', domain }, content, undefined, 50),
      (error: unknown) => error instanceof NotificationDeliveryError && error.status === 504);
  } finally { await close(server); }
});

test('test API explains connection refusal and upstream rejection', async () => {
  const server = createServer((_request, response) => { response.writeHead(403); response.end('private upstream content'); });
  const domain = await listen(server);
  const request = () => new Request('http://localhost/api/test-notification', {
    method: 'POST', body: JSON.stringify({ service: 'ntfy', topic: 'billing', domain })
  });
  try {
    const rejected = await POST(request());
    assert.equal(rejected.status, 403);
    assert.match((await rejected.json()).error, /HTTP 403/);
  } finally { await close(server); }
  const refused = await POST(request());
  assert.equal(refused.status, 502);
  assert.match((await refused.json()).error, /refused/);
});

test('response-body stalls obey the same delivery deadline', async () => {
  const server = createServer((_request, response) => {
    response.writeHead(200); response.write('unfinished');
  });
  const domain = await listen(server);
  try {
    await assert.rejects(sendNotification({ service: 'ntfy', topic: 'billing', domain }, content, undefined, 50),
      (error: unknown) => error instanceof NotificationDeliveryError && error.status === 504);
  } finally { await close(server); }
});

test('test API rejects malformed JSON and incomplete settings', async () => {
  for (const body of ['{', 'null', '{}', '{"service":"unknown"}', '{"service":"ntfy","topic":"  ","domain":"http://localhost"}']) {
    const response = await POST(new Request('http://localhost/api/test-notification', { method: 'POST', body }));
    assert.equal(response.status, 400);
  }
});
