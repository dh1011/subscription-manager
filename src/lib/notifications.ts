import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  isAfter,
  isBefore,
  isSameDay,
  isValid,
  parseISO,
  startOfDay
} from 'date-fns';
import { getDb } from '@/lib/db';
import { formatLocalDate } from '@/lib/dateUtils';
import { NtfySettings, Subscription } from '@/types';

type FetchImplementation = typeof fetch;

export interface NotificationContent {
  title: string;
  message: string;
  priority?: number;
}

export class NotificationDeliveryError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'NotificationDeliveryError';
  }
}

export interface NotificationCheckData {
  subscriptions: Subscription[];
  settings: NtfySettings | null;
}

export interface NotificationCheckResult {
  attempted: number;
  sent: number;
  failed: number;
}

interface NotificationCheckDependencies {
  loadData: () => Promise<NotificationCheckData>;
  send: (settings: NtfySettings, content: NotificationContent) => Promise<void>;
  logger: Pick<Console, 'info' | 'warn' | 'error'>;
}

const MAX_OCCURRENCE_STEPS = 100_000;
const schedulerKey = '__subscriptionManagerNotificationScheduler';

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizeIntervalValue(value: number | string | undefined): number | null {
  const parsed = Number(value ?? 1);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

function nextOccurrence(date: Date, value: number, unit: string): Date | null {
  switch (unit) {
    case 'days':
      return addDays(date, value);
    case 'weeks':
      return addWeeks(date, value);
    case 'months':
      return addMonths(date, value);
    case 'years':
      return addYears(date, value);
    default:
      return null;
  }
}

export function shouldNotifyOnDate(subscription: Subscription, referenceDate: Date): boolean {
  if (!Boolean(subscription.notify)) {
    return false;
  }

  const dueDateValue = subscription.dueDate || subscription.due_date;
  if (!dueDateValue) {
    return false;
  }

  const firstOccurrence = startOfDay(parseISO(dueDateValue));
  const targetDate = startOfDay(referenceDate);

  if (!isValid(firstOccurrence) || isAfter(firstOccurrence, targetDate)) {
    return false;
  }

  const endDateValue = subscription.endDate || subscription.end_date;
  if (endDateValue) {
    const endDate = startOfDay(parseISO(endDateValue));
    if (!isValid(endDate) || isAfter(targetDate, endDate)) {
      return false;
    }
  }

  const intervalValue = normalizeIntervalValue(
    subscription.intervalValue ?? subscription.interval_value
  );
  const intervalUnit = subscription.intervalUnit || subscription.interval_unit;

  if (!intervalValue || !intervalUnit) {
    return false;
  }

  let occurrence = firstOccurrence;

  for (let step = 0; step < MAX_OCCURRENCE_STEPS; step += 1) {
    if (isSameDay(occurrence, targetDate)) {
      return true;
    }

    if (!isBefore(occurrence, targetDate)) {
      return false;
    }

    const followingOccurrence = nextOccurrence(occurrence, intervalValue, intervalUnit);
    if (!followingOccurrence || !isAfter(followingOccurrence, occurrence)) {
      return false;
    }

    occurrence = followingOccurrence;
  }

  return false;
}

export async function sendNotification(
  settings: NtfySettings,
  content: NotificationContent,
  fetchImplementation: FetchImplementation = fetch
): Promise<void> {
  if ((settings.service || 'ntfy') === 'gotify') {
    if (!settings.gotifyUrl || !settings.gotifyToken) {
      throw new NotificationDeliveryError('Gotify URL and token are required', 400);
    }

    const response = await fetchImplementation(`${trimTrailingSlashes(settings.gotifyUrl)}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Gotify-Key': settings.gotifyToken
      },
      body: JSON.stringify({
        title: content.title,
        message: content.message,
        priority: content.priority ?? 5
      })
    });

    if (!response.ok) {
      throw new NotificationDeliveryError('Gotify rejected the notification', response.status);
    }

    return;
  }

  if (!settings.topic || !settings.domain) {
    throw new NotificationDeliveryError('NTFY topic and domain are required', 400);
  }

  const response = await fetchImplementation(
    `${trimTrailingSlashes(settings.domain)}/${settings.topic}`,
    {
      method: 'POST',
      body: content.message
    }
  );

  if (!response.ok) {
    throw new NotificationDeliveryError('NTFY rejected the notification', response.status);
  }
}

export async function loadNotificationCheckData(): Promise<NotificationCheckData> {
  const db = await getDb();

  try {
    const subscriptions = await db.all<Subscription[]>(
      'SELECT * FROM subscriptions WHERE notify = 1'
    );
    const settingsRow = await db.get<{
      service: 'ntfy' | 'gotify';
      topic: string;
      domain?: string;
      gotify_url?: string;
      gotify_token?: string;
    }>(`
      SELECT service, topic, domain, gotify_url, gotify_token
      FROM ntfy_settings
      ORDER BY id DESC
      LIMIT 1
    `);

    return {
      subscriptions: subscriptions.map(subscription => ({
        ...subscription,
        dueDate: subscription.due_date || subscription.dueDate,
        endDate: subscription.end_date || subscription.endDate,
        intervalValue: subscription.interval_value ?? subscription.intervalValue,
        intervalUnit: subscription.interval_unit ?? subscription.intervalUnit
      })),
      settings: settingsRow
        ? {
            service: settingsRow.service || 'ntfy',
            topic: settingsRow.topic || '',
            domain: settingsRow.domain || 'https://ntfy.sh',
            gotifyUrl: settingsRow.gotify_url || '',
            gotifyToken: settingsRow.gotify_token || ''
          }
        : null
    };
  } finally {
    await db.close();
  }
}

const defaultDependencies: NotificationCheckDependencies = {
  loadData: loadNotificationCheckData,
  send: sendNotification,
  logger: console
};

export async function runDueNotificationCheck(
  referenceDate = new Date(),
  dependencyOverrides: Partial<NotificationCheckDependencies> = {}
): Promise<NotificationCheckResult> {
  const dependencies = { ...defaultDependencies, ...dependencyOverrides };
  const data = await dependencies.loadData();
  const dueSubscriptions = data.subscriptions.filter(subscription =>
    shouldNotifyOnDate(subscription, referenceDate)
  );

  if (!data.settings) {
    if (dueSubscriptions.length > 0) {
      dependencies.logger.warn('Notification settings are not configured; skipping due notifications.');
    }
    return { attempted: 0, sent: 0, failed: 0 };
  }

  const result: NotificationCheckResult = { attempted: 0, sent: 0, failed: 0 };

  for (const subscription of dueSubscriptions) {
    result.attempted += 1;
    const dueDate = formatLocalDate(referenceDate);
    const content: NotificationContent = {
      title: 'Subscription Due',
      message: `Subscription due: ${subscription.name} - Amount: ${subscription.amount} - Due Date: ${dueDate}`,
      priority: 5
    };

    try {
      await dependencies.send(data.settings, content);
      result.sent += 1;
      dependencies.logger.info(`Notification sent for subscription ${subscription.name} due on ${dueDate}`);
    } catch (error) {
      result.failed += 1;
      dependencies.logger.error(`Failed to send notification for subscription ${subscription.name}:`, error);
    }
  }

  return result;
}

export function millisecondsUntilNextMidnight(now: Date): number {
  const nextMidnight = new Date(now);
  nextMidnight.setDate(nextMidnight.getDate() + 1);
  nextMidnight.setHours(0, 0, 0, 0);
  return nextMidnight.getTime() - now.getTime();
}

export function startNotificationScheduler(): void {
  const schedulerState = globalThis as typeof globalThis & Record<string, NodeJS.Timeout | undefined>;

  if (schedulerState[schedulerKey]) {
    return;
  }

  const scheduleNextRun = () => {
    const now = new Date();
    const delay = millisecondsUntilNextMidnight(now);
    const nextRun = new Date(now.getTime() + delay);

    const timer = setTimeout(async () => {
      try {
        await runDueNotificationCheck(new Date());
      } catch (error) {
        console.error('Daily notification check failed:', error);
      } finally {
        schedulerState[schedulerKey] = undefined;
        scheduleNextRun();
      }
    }, delay);

    timer.unref();
    schedulerState[schedulerKey] = timer;
    console.info(`Notification scheduler initialized; next run at ${nextRun.toISOString()}`);
  };

  scheduleNextRun();
}
