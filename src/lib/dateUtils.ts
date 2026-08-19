import { format } from 'date-fns';

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function formatLocalDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}
