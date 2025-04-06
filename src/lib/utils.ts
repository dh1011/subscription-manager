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
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEEAD', // Yellow
    '#D4A5A5', // Pink
    '#9B59B6', // Purple
    '#3498DB', // Light Blue
    '#E67E22', // Orange
    '#2ECC71', // Emerald
    '#F1C40F', // Sun Yellow
    '#E74C3C', // Dark Red
    '#1ABC9C', // Turquoise
    '#9B59B6', // Amethyst
    '#34495E', // Dark Blue
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
} 