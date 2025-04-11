import { Subscription } from '@/types';
import { addDays, addMonths, addWeeks, addYears } from 'date-fns';

export function computeNextDueDates(subscription: Subscription): Date[] {
  const now = new Date();
  const dueDate = new Date(subscription.dueDate);
  let nextDueDate = dueDate;
  const dueDates: Date[] = [];
  const oneMonthLater = addMonths(now, 1);

  while (nextDueDate <= oneMonthLater) {
    if (nextDueDate >= now) {
      dueDates.push(nextDueDate);
    }

    const interval = subscription.intervalValue || 1;

    switch (subscription.intervalUnit) {
      case 'days':
        nextDueDate = addDays(nextDueDate, interval);
        break;
      case 'weeks':
        nextDueDate = addWeeks(nextDueDate, interval);
        break;
      case 'months':
        nextDueDate = addMonths(nextDueDate, interval);
        break;
      case 'years':
        nextDueDate = addYears(nextDueDate, interval);
        break;
      default:
        return dueDates;
    }
  }

  return dueDates;
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function getRandomColor(): string {
  const pastelColors = [
    '#FFD6D6', // Pastel Red
    '#D6F5F5', // Pastel Teal
    '#D6EEFA', // Pastel Blue
    '#D8EFE2', // Pastel Green
    '#FFF6D6', // Pastel Yellow
    '#F2D6D6', // Pastel Pink
    '#E7D6F5', // Pastel Purple
    '#D6E7F5', // Pastel Light Blue
    '#F8E1D2', // Pastel Orange
    '#D6F5DD', // Pastel Emerald
    '#FFF1C8', // Pastel Sun Yellow
    '#F5D6D6', // Pastel Dark Red
    '#D6F2EF', // Pastel Turquoise
    '#E2D6F5', // Pastel Amethyst
    '#E0E6ED', // Pastel Gray Blue
  ];
  
  return pastelColors[Math.floor(Math.random() * pastelColors.length)];
} 