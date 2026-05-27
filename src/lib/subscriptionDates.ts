import { addDays, addMonths, addWeeks, addYears, parseISO, startOfDay } from 'date-fns';
import { Subscription } from '@/types';

export function getSubscriptionEndDate(subscription: Subscription): Date | null {
  const endDateValue = subscription.endDate || subscription.end_date;

  if (!endDateValue) {
    return null;
  }

  const endDate = parseISO(endDateValue);

  return isNaN(endDate.getTime()) ? null : startOfDay(endDate);
}

export function isSubscriptionActive(subscription: Subscription, referenceDate = new Date()): boolean {
  const endDate = getSubscriptionEndDate(subscription);

  if (!endDate) {
    return true;
  }

  return endDate >= startOfDay(referenceDate);
}

export function isSubscriptionEnded(subscription: Subscription, referenceDate = new Date()): boolean {
  return !isSubscriptionActive(subscription, referenceDate);
}

export function isOnOrBeforeSubscriptionEnd(date: Date, subscription: Subscription): boolean {
  const endDate = getSubscriptionEndDate(subscription);

  if (!endDate) {
    return true;
  }

  return startOfDay(date) <= endDate;
}

export function getShownCycleDate(subscription: Subscription, referenceDate = new Date()): Date | null {
  if (isSubscriptionEnded(subscription, referenceDate)) {
    return null;
  }

  const dueDateValue = subscription.dueDate || subscription.due_date;

  if (!dueDateValue) {
    return null;
  }

  let dueDate = parseISO(dueDateValue);
  const intervalValue = subscription.intervalValue ?? subscription.interval_value ?? 1;
  const intervalUnit = subscription.intervalUnit ?? subscription.interval_unit ?? 'months';

  while (dueDate <= referenceDate) {
    switch (intervalUnit) {
      case 'days':
        dueDate = addDays(dueDate, intervalValue);
        break;
      case 'weeks':
        dueDate = addWeeks(dueDate, intervalValue);
        break;
      case 'months':
        dueDate = addMonths(dueDate, intervalValue);
        break;
      case 'years':
        dueDate = addYears(dueDate, intervalValue);
        break;
      default:
        return dueDate;
    }
  }

  return dueDate;
}
