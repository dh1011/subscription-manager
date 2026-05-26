import { parseISO, startOfDay } from 'date-fns';
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
