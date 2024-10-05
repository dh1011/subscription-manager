// src/components/CalendarGrid.js
import React from 'react';
import './CalendarGrid.css';
import { getDaysInMonth, getFirstDayOfMonth } from './utils/dateUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { parseISO, addDays, addMonths, addYears, isSameMonth, getDate, set } from 'date-fns';

function CalendarGrid({ subscriptions, onDateClick, currentDate }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map subscriptions by date
  const subscriptionsByDate = {};
  subscriptions.forEach((sub) => {
    if (sub.due_date) {
      let currentDate = parseISO(sub.due_date);
      // Set the currentDate time to noon to avoid timezone issues
      currentDate = set(currentDate, { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 });

      const endDate = set(new Date(year, month + 1, 0), { hours: 12, minutes: 0, seconds: 0, milliseconds: 0 });

      while (currentDate <= endDate) {
        if (isSameMonth(currentDate, new Date(year, month))) {
          const dateKey = getDate(currentDate);
          if (!subscriptionsByDate[dateKey]) {
            subscriptionsByDate[dateKey] = [];
          }
          subscriptionsByDate[dateKey].push(sub);
        }

        // Move to the next occurrence based on the interval
        switch (sub.interval_unit) {
          case 'days':
            currentDate = addDays(currentDate, sub.interval_value);
            break;
          case 'weeks':
            currentDate = addDays(currentDate, sub.interval_value * 7);
            break;
          case 'months':
            currentDate = addMonths(currentDate, sub.interval_value);
            break;
          case 'years':
            currentDate = addYears(currentDate, sub.interval_value);
            break;
          default:
            currentDate = addDays(endDate, 1); // Stop the loop for non-recurring subscriptions
        }
      }
    }
  });

  return (
    <div className="calendar-container">
      <div className="calendar-grid">
        {daysOfWeek.map((day) => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}
        {Array(firstDayOfMonth)
          .fill(null)
          .map((_, index) => (
            <div key={`empty-${index}`} className="calendar-day empty"></div>
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
              className={`calendar-day ${isToday ? 'today' : ''}`}
              onClick={() => onDateClick(new Date(year, month, day))}
            >
              <div className="date-number">{day}</div>
              <div className="subscriptions">
                {subs.map((sub, index) => (
                  <FontAwesomeIcon
                    key={`${sub.id}-${index}`}
                    icon={['fa', sub.icon]}
                    className="subscription-icon"
                    style={{ color: sub.color }}
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