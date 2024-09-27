// src/components/Totals.js
import React from 'react';
import './Totals.css';

function Totals({ subscriptions }) {
  const calculateTotal = (period) => {
    const monthlyTotal = subscriptions.reduce((acc, sub) => acc + parseFloat(sub.amount || 0), 0);
    switch (period) {
      case 'week':
        return ((monthlyTotal * 12) / 52).toFixed(2);
      case 'month':
        return monthlyTotal.toFixed(2);
      case 'year':
        return (monthlyTotal * 12).toFixed(2);
      default:
        return '0.00';
    }
  };

  return (
    <div className="totals">
      <h2>Summary </h2>
      <div className="totals-grid">
        <div className="total-card weekly">
          <h3>Weekly</h3>
          <p>${calculateTotal('week')}</p>
        </div>
        <div className="total-card monthly">
          <h3>Monthly</h3>
          <p>${calculateTotal('month')}</p>
        </div>
        <div className="total-card yearly">
          <h3>Yearly</h3>
          <p>${calculateTotal('year')}</p>
        </div>
      </div>
    </div>
  );
}

export default Totals;
