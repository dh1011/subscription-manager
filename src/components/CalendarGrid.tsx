import React from 'react';
import { getDaysInMonth, getFirstDayOfMonth } from '../lib/dateUtils';
import { parseISO, addDays, addMonths, addYears, isSameMonth, getDate, set } from 'date-fns';
import { Icon } from '@iconify-icon/react';
import styles from './CalendarGrid.module.css';
import { Subscription as AppSubscription } from '@/types';

interface CalendarSubscription {
  id?: number | string;
  icon?: string;
  color?: string;
  dueDate?: string;
  intervalUnit?: string;
  intervalValue?: number;
}

interface CalendarGridProps {
  subscriptions: AppSubscription[];
  onDateClick: (date: Date) => void;
  currentDate: Date;
}

function CalendarGrid({ subscriptions, onDateClick, currentDate }: CalendarGridProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map subscriptions by date
  const subscriptionsByDate: { [key: number]: CalendarSubscription[] } = {};
  
  subscriptions.forEach((sub, index) => {
    // Check for dueDate property with type safety
    const dueDate = sub.dueDate || (sub as any).due_date;
    
    if (dueDate) {
      try {
        let currentDate = parseISO(dueDate);
        
        // Set the currentDate time to noon to avoid timezone issues
        currentDate = set(currentDate, { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 });

        const endDate = set(new Date(year, month + 1, 0), { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 });

        // Get interval info - check both camelCase and snake_case properties
        const intervalUnit = sub.intervalUnit || sub.interval_unit || 'months';
        const intervalValue = sub.intervalValue || sub.interval_value || 1;
        
        while (currentDate <= endDate) {
          if (isSameMonth(currentDate, new Date(year, month))) {
            const dateKey = getDate(currentDate);
            
            if (!subscriptionsByDate[dateKey]) {
              subscriptionsByDate[dateKey] = [];
            }
            
            subscriptionsByDate[dateKey].push({
              id: sub.id,
              icon: sub.icon,
              color: sub.color,
              dueDate: dueDate,
              intervalUnit: intervalUnit,
              intervalValue: typeof intervalValue === 'string' ? parseInt(intervalValue, 10) : intervalValue
            });
          }

          // Move to the next occurrence based on the interval
          const intervalValueNumber = typeof intervalValue === 'string' ? parseInt(intervalValue, 10) : intervalValue;
          
          switch (intervalUnit) {
            case 'days':
              currentDate = addDays(currentDate, intervalValueNumber);
              break;
            case 'weeks':
              currentDate = addDays(currentDate, intervalValueNumber * 7);
              break;
            case 'months':
              currentDate = addMonths(currentDate, intervalValueNumber);
              break;
            case 'years':
              currentDate = addYears(currentDate, intervalValueNumber);
              break;
            default:
              currentDate = addDays(endDate, 1); // Stop the loop for non-recurring subscriptions
          }
        }
      } catch (error) {
        console.error(`Error processing subscription ${sub.id}:`, error);
      }
    } else {
      console.log(`Subscription ${index} has no due date`);
    }
  });

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.calendarGrid}>
        {daysOfWeek.map((day) => (
          <div key={day} className={styles.calendarDayHeader}>
            {day}
          </div>
        ))}
        {Array(firstDayOfMonth)
          .fill(null)
          .map((_, index) => (
            <div key={`empty-${index}`} className={`${styles.calendarDay} ${styles.empty}`}></div>
          ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const subs = subscriptionsByDate[day] || [];
          const isToday =
            year === today.getFullYear() &&
            month === today.getMonth() &&
            day === today.getDate();
          return (
            <div
              key={day}
              className={`${styles.calendarDay} ${isToday ? styles.today : ''}`}
              onClick={() => onDateClick(new Date(year, month, day))}
            >
              <div className={styles.dateNumber}>{day}</div>
              <div className={styles.subscriptions}>
                {subs.map((sub, index) => (
                  <Icon
                    key={`${sub.id}-${index}`}
                    icon={`mdi:${sub.icon || 'calendar'}`}
                    className={styles.subscriptionIcon}
                    style={{ color: sub.color || '#fff' }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CalendarGrid; 