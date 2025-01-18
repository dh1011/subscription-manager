// src/utils/dateUtils.js

export function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }
  
  export function getFirstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }
  