import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setImmediate } from 'node:timers/promises';
import test from 'node:test';

test('scheduler starts once, loads saved settings, sends at midnight, and schedules the next day', async context => {
  const originalDirectory = process.cwd();
  const directory = await mkdtemp(path.join(tmpdir(), 'notification-scheduler-'));
  process.chdir(directory);
  const received: string[] = [];
  const logs: string[] = [];
  const server = createServer(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    received.push(body);
    response.end('ok');
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  try {
    const { initializeDb, getDb } = await import('./db');
    const { startNotificationScheduler } = await import('./notifications');
    await initializeDb();
    const db = await getDb();
    await db.run('INSERT INTO ntfy_settings (service, topic, domain) VALUES (?, ?, ?)',
      ['ntfy', 'billing', `http://localhost:${(server.address() as AddressInfo).port}`]);
    await db.run(`INSERT INTO subscriptions (name, amount, due_date, interval_value, interval_unit, notify)
      VALUES ('Due plan', 10, '2026-10-02', 1, 'days', 1)`);
    await db.close();
    context.mock.method(console, 'info', (message: string) => logs.push(message));
    context.mock.timers.enable({ apis: ['Date', 'setTimeout'], now: new Date(2026, 9, 1, 23, 59, 59) });
    startNotificationScheduler();
    startNotificationScheduler();
    assert.equal(logs.filter(log => log.includes('scheduler initialized')).length, 1);
    context.mock.timers.tick(1000);
    for (let attempt = 0; attempt < 2000 && !logs.some(log => log.includes('check complete')); attempt++) {
      await setImmediate();
    }
    assert.equal(received.length, 1);
    assert.match(received[0], /Due plan.*2026-10-02/);
    assert(logs.some(log => log.includes('1 attempted, 1 sent, 0 failed')));
    assert.equal(logs.filter(log => log.includes('scheduler initialized')).length, 2);
  } finally {
    context.mock.timers.reset();
    delete (globalThis as typeof globalThis & Record<string, unknown>).__subscriptionManagerNotificationScheduler;
    server.closeAllConnections();
    await new Promise<void>(resolve => server.close(() => resolve()));
    process.chdir(originalDirectory);
    await rm(directory, { recursive: true, force: true });
  }
});
