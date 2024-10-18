// src/components/Totals.js
import React from 'react';
import './Totals.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faCalendarWeek, faCalendarAlt, faCalendarDay } from '@fortawesome/free-solid-svg-icons';
import getSymbolFromCurrency from 'currency-symbol-map/currency-symbol-map';

function Totals({ subscriptions, currency }) {
  const [selectedPeriod, setSelectedPeriod] = React.useState('month');

  const calculateTotal = (period) => {
    const totals = {};
    subscriptions.forEach((sub) => {
      const amount = parseFloat(sub.amount || 0);
      if (!totals[sub.currency]) {
        totals[sub.currency] = 0;
      }
      switch (period) {
        case 'week':
          totals[sub.currency] += (amount * 12) / 52;
          break;
        case 'month':
          totals[sub.currency] += amount;
          break;
        case 'year':
          totals[sub.currency] += amount * 12;
          break;
        default:
          // Handle unexpected period
          console.warn(`Unexpected period: ${period}`);
          break;
      }
    });

    return Object.entries(totals).map(([currency, total]) => {
      const symbol = getSymbolFromCurrency(currency) || '$';
      return `${symbol}${total.toFixed(2)} ${currency}`;
    });
  };

  const calculateAccountTotal = (account, subCurrency, period) => {
    let total = 0;
    subscriptions.forEach((sub) => {
      if (sub.account === account && sub.currency === subCurrency) {
        const amount = parseFloat(sub.amount || 0);
        switch (period) {
          case 'week':
            total += (amount * 12) / 52;
            break;
          case 'month':
            total += amount;
            break;
          case 'year':
            total += amount * 12;
            break;
          default:
            // Handle unexpected period
            console.warn(`Unexpected period: ${period}`);
            break;
        }
      }
    });
    return total;
  };

  // Calculate totals per account and currency
  const accountTotals = {};

  subscriptions.forEach((sub) => {
    const account = sub.account || 'Unspecified';
    const subCurrency = sub.currency || currency;
    if (!accountTotals[account]) {
      accountTotals[account] = {};
    }
    if (!accountTotals[account][subCurrency]) {
      accountTotals[account][subCurrency] = 0;
    }

    const amount = parseFloat(sub.amount || 0);
    accountTotals[account][subCurrency] += amount;
  });

  return (
    <div className="totals">
      <div className="summary-grid">
        <div className="summary-section period-summary">
          <h2>Summary</h2>
          <div className="period-cards">
            {['week', 'month', 'year'].map((period) => (
              <div
                key={period}
                className={`total-card ${period} ${selectedPeriod === period ? 'selected' : ''}`}
                onClick={() => setSelectedPeriod(period)}
              >
                <h4>
                  <FontAwesomeIcon
                    icon={period === 'week' ? faCalendarWeek : period === 'month' ? faCalendarAlt : faCalendarDay}
                    className="period-icon"
                  />{' '}
                  {period.charAt(0).toUpperCase() + period.slice(1)}ly
                </h4>
                {calculateTotal(period).map((total, index) => (
                  <p key={index}>
                    <span className="currency-symbol">
                      {total.charAt(0)}
                    </span>
                    {total.slice(1)}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="summary-section account-summary">
          <h3>Details Summary</h3>
          <div className="account-totals-grid">
            {Object.entries(accountTotals).map(([account, currencies], index) => (
              <div key={index} className="account-total-card">
                <h4>
                  <FontAwesomeIcon icon={faCreditCard} className="credit-card-icon" />{' '}
                  {account}
                </h4>
                <div className="account-totals">
                  {Object.entries(currencies).map(([currencyCode, _], currencyIndex) => {
                    const total = calculateAccountTotal(account, currencyCode, selectedPeriod);
                    return (
                      <div key={currencyIndex} className="account-total">
                        <p>
                          <span className="currency-symbol">
                            {getSymbolFromCurrency(currencyCode) || '$'}
                          </span>
                          {total.toFixed(2)} {currencyCode}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Totals;
