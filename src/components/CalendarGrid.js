// src/components/CalendarGrid.js
import React from 'react';
import './CalendarGrid.css';
import { getDaysInMonth, getFirstDayOfMonth } from './utils/dateUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function CalendarGrid({ subscriptions, onDateClick, currentDate }) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Map subscriptions by date
  const subscriptionsByDate = {};
  subscriptions.forEach((sub) => {
    if (sub.due_date) {
      // Parse the due date string into a Date object
      const date = new Date(sub.due_date);
      const dateYear = date.getFullYear();
      const dateMonth = date.getMonth();
      const dateDay = date.getDate();

      // Only include subscriptions that match the current month and year
      if (dateYear === year && dateMonth === month) {
        if (!subscriptionsByDate[dateDay]) {
          subscriptionsByDate[dateDay] = [];
        }
        subscriptionsByDate[dateDay].push(sub);
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
          return (
            <div
              key={day}
              className="calendar-day"
              onClick={() => onDateClick(new Date(year, month, day))}
            >
              <div className="date-number">{day}</div>
              <div className="subscriptions">
                {subs.map((sub, index) => (
                  <FontAwesomeIcon
                    key={index}
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
