// src/components/Calendar.js
import React from 'react';
import Calendar from 'react-calendar';
import styled from 'styled-components';
import 'react-calendar/dist/Calendar.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const CalendarContainer = styled.div`
  .react-calendar {
    background-color: ${({ theme }) => theme.modalBackground};
    color: ${({ theme }) => theme.text};
    border: none;
    width: 100%;
    max-width: 1000px;
    margin: 20px auto;
    font-size: 1.5em;
    border-radius: 15px;
  }

  .react-calendar__tile {
    position: relative;
    height: 100px;
    width: 100px;
    display: flex;
    flex-direction: column-reverse;
    color: ${({ theme }) => theme.text};
  }

  .react-calendar__tile:enabled:hover,
  .react-calendar__tile:enabled:focus {
    background-color: ${({ theme }) => theme.modalBackground};
    border: 2px solid ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.text};
    border-radius: 10px;
  }

  .react-calendar__tile--active {
    background-color: ${({ theme }) => theme.modalBackground};
    border: 2px solid ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.text};
    border-radius: 10px;
  }

  .react-calendar__tile--now {
    background-color: ${({ theme }) => theme.accent} !important;
    border-radius: 10px;
  }

  .react-calendar__tile div {
    margin-top: 5px;
  }

  /* Weekdays (Monday to Friday) */
  .react-calendar__month-view__days__day--weekend {
    color: white !important;
  }

  .react-calendar__month-view__days__day:not(.react-calendar__month-view__days__day--weekend) {
    color: ${({ theme }) => theme.accent} !important;
  }

  /* Previous and next month dates */
  .react-calendar__tile--neighboringMonth {
    color: gray !important;
  }

  .react-calendar__month-view__weekdays {
    background-color: ${({ theme }) => theme.accent};
    color: ${({ theme }) => theme.text};
  }

  .react-calendar__month-view__weekdays__weekday {
    font-weight: bold;
    font-size: 1em;
  }

  .react-calendar__navigation {
    margin-bottom: 10px;
  }

  .react-calendar__navigation button {
    color: ${({ theme }) => theme.text};
    font-size: 1em;
  }

  .react-calendar__navigation button:disabled {
    background-color: ${({ theme }) => theme.modalBackground};
  }
`;

function SubscriptionCalendar({ subscriptions, onDateClick }) {
  // Function to generate dates for recurring subscriptions
  const generateDates = (sub) => {
    const dates = [];
    const startDate = new Date(sub.dueDate + 'T00:00:00');
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // Generate dates for the next year
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      switch (sub.recurrence) {
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + 7);
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + 1);
          break;
        case 'yearly':
          currentDate.setFullYear(currentDate.getFullYear() + 1);
          break;
        default:
          currentDate = new Date(endDate.getTime() + 1); // Stop loop for non-recurring
          break;
      }
    }

    return dates;
  };

  // Map dates to subscriptions
  const dateSubscriptions = {};
  subscriptions.forEach((sub) => {
    const dates = generateDates(sub);
    dates.forEach((date) => {
      const dateStr = date.toDateString();
      if (!dateSubscriptions[dateStr]) dateSubscriptions[dateStr] = [];
      dateSubscriptions[dateStr].push(sub);
    });
  });

  // Function to render content on calendar tiles
  const tileContent = ({ date, view }) => {
    const dateStr = date.toDateString();
    if (view === 'month') {
      return (
        <>
          {dateSubscriptions[dateStr] && (
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
              {dateSubscriptions[dateStr].map((sub, index) => (
                <FontAwesomeIcon
                  key={index}
                  icon={['fa', sub.icon]}
                  style={{ color: '#03DAC6', margin: '2px' }}
                />
              ))}
            </div>
          )}
        </>
      );
    }
    return null;
  };

  // Handle date clicks
  const onClickDay = (date) => {
    onDateClick(date);
  };

  return (
    <CalendarContainer>
      <Calendar
        tileContent={tileContent}
        onClickDay={onClickDay}
        formatShortWeekday={(locale, date) =>
          date.toLocaleDateString(locale, { weekday: 'short' }).charAt(0)
        }
      />
    </CalendarContainer>
  );
}

export default SubscriptionCalendar;
