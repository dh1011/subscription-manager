import { initializeDb } from './lib/db';
import { startNotificationScheduler } from './lib/notifications';

export async function initializeServer() {
  await initializeDb();
  startNotificationScheduler();
}
