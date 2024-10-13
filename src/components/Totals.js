// src/components/Totals.js
import React from 'react';
import './Totals.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard } from '@fortawesome/free-solid-svg-icons';
import getSymbolFromCurrency from 'currency-symbol-map/currency-symbol-map';

function Totals({ subscriptions, currency, exchangeRates }) {
  // console.log("subscriptions", subscriptions);
  const calculateTotal = (period) => {
    const total = subscriptions.reduce((acc, sub) => {
      const amount = parseFloat(sub.amount || 0);
      const rate = exchangeRates[currency] / exchangeRates[sub.currency];
      return acc + (amount * rate);
    }, 0);

    const symbol = getSymbolFromCurrency(currency) || '$';
    switch (period) {
      case 'week':
        return `${symbol}${((total * 12) / 52).toFixed(2)}`;
      case 'month':
        return `${symbol}${total.toFixed(2)}`;
      case 'year':
        return `${symbol}${(total * 12).toFixed(2)}`;
      default:
        return `${symbol}0.00`;
    }
  };

  // Calculate totals per account
  const accountTotals = {};

  subscriptions.forEach((sub) => {
    const account = sub.account || 'Unspecified';
    if (!accountTotals[account]) {
      accountTotals[account] = { week: 0, month: 0, year: 0 };
    }

    const amount = parseFloat(sub.amount || 0);

    // Assuming amount is monthly, calculate weekly and yearly amounts
    const weeklyAmount = (amount * 12) / 52;
    const yearlyAmount = amount * 12;

    accountTotals[account].week += weeklyAmount;
    accountTotals[account].month += amount;
    accountTotals[account].year += yearlyAmount;
  });

  return (
    <div className="totals">
      <h2>Summary</h2>
      <div className="totals-grid">
        <div className="total-card weekly">
          <h3>Weekly</h3>
          <p>{calculateTotal('week')}</p>
        </div>
        <div className="total-card monthly">
          <h3>Monthly</h3>
          <p>{calculateTotal('month')}</p>
        </div>
        <div className="total-card yearly">
          <h3>Yearly</h3>
          <p>{calculateTotal('year')}</p>
        </div>
      </div>

      {subscriptions.length > 0 && (
        <>
          <h2 className="detail-summaries-title">Detail Summaries</h2>
          <div className="account-totals-grid">
            {Object.entries(accountTotals).map(([account, totals], index) => (
              <div key={index} className="account-total-card">
                <h3>
                  <FontAwesomeIcon icon={faCreditCard} className="credit-card-icon" />{' '}
                  {account}
                </h3>
                <div className="account-totals">
                  <div className="account-total weekly">
                    <p>Weekly:</p>
                    <p>{getSymbolFromCurrency(currency) || '$'}{totals.week.toFixed(2)}</p>
                  </div>
                  <div className="account-total monthly">
                    <p>Monthly:</p>
                    <p>{getSymbolFromCurrency(currency) || '$'}{totals.month.toFixed(2)}</p>
                  </div>
                  <div className="account-total yearly">
                    <p>Yearly:</p>
                    <p>{getSymbolFromCurrency(currency) || '$'}{totals.year.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Totals;