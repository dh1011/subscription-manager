// src/components/Totals.js
import React, { useState, useEffect } from 'react';
import './Totals.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard } from '@fortawesome/free-solid-svg-icons';
import getSymbolFromCurrency from 'currency-symbol-map/currency-symbol-map';

function Totals({ subscriptions, currency }) {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [defaultCurrency, setDefaultCurrency] = useState(currency);

  useEffect(() => {
    // Fetch the user's default currency from the server
    fetch('/api/user-configuration')
      .then(response => response.json())
      .then(data => {
        setDefaultCurrency(data.currency || 'USD');
      })
      .catch(error => console.error('Error fetching user configuration:', error));
  }, []);

  const calculateTotal = (period) => {
    const totals = {};
    subscriptions.forEach((sub) => {
      if (!sub.included) return;
      const amount = parseFloat(sub.amount || 0);
      const intervalValue = parseInt(sub.interval_value) || 1;
      const intervalUnit = sub.interval_unit || 'months';
      const subCurrency = sub.currency === 'default' ? defaultCurrency : (sub.currency || defaultCurrency);
      
      if (!totals[subCurrency]) {
        totals[subCurrency] = 0;
      }

      let annualAmount = 0;
      switch (intervalUnit) {
        case 'days':
          annualAmount = (amount * 365) / intervalValue;
          break;
        case 'weeks':
          annualAmount = (amount * 52) / intervalValue;
          break;
        case 'months':
          annualAmount = (amount * 12) / intervalValue;
          break;
        case 'years':
          annualAmount = amount / intervalValue;
          break;
        default:
          annualAmount = amount * 12;
      }

      switch (period) {
        case 'week':
          totals[subCurrency] += (annualAmount / 52);
          break;
        case 'month':
          totals[subCurrency] += (annualAmount / 12);
          break;
        case 'year':
          totals[subCurrency] += annualAmount;
          break;
        default:
          break;
      }
    });

    return Object.entries(totals).map(([curr, total]) => {
      const symbol = getSymbolFromCurrency(curr) || '$';
      return (
        <span key={curr}>
          <span className="currency-symbol">{symbol}</span>{total.toFixed(2)}
        </span>
      );
    });
  };

  const accountTotals = subscriptions.reduce((acc, sub) => {
    if (!sub.included) return acc;
    const account = sub.account || 'Unspecified';
    const subCurrency = sub.currency === 'default' ? defaultCurrency : (sub.currency || defaultCurrency);
    if (!acc[account]) {
      acc[account] = {};
    }
    if (!acc[account][subCurrency]) {
      acc[account][subCurrency] = { week: 0, month: 0, year: 0 };
    }

    const amount = parseFloat(sub.amount || 0);
    const intervalValue = parseInt(sub.interval_value) || 1;
    const intervalUnit = sub.interval_unit || 'months';

    let annualAmount = 0;
    switch (intervalUnit) {
      case 'days':
        annualAmount = (amount * 365) / intervalValue;
        break;
      case 'weeks':
        annualAmount = (amount * 52) / intervalValue;
        break;
      case 'months':
        annualAmount = (amount * 12) / intervalValue;
        break;
      case 'years':
        annualAmount = amount / intervalValue;
        break;
      default:
        annualAmount = amount * 12;
    }

    acc[account][subCurrency].week += annualAmount / 52;
    acc[account][subCurrency].month += annualAmount / 12;
    acc[account][subCurrency].year += annualAmount;

    return acc;
  }, {});

  const handlePeriodClick = (period) => {
    setSelectedPeriod(period);
  };

  return (
    <div className="totals">
      <h2>Summary</h2>
      <div className="totals-grid">
        {['week', 'month', 'year'].map((period) => (
          <div
            key={period}
            className={`total-card ${period}ly ${selectedPeriod === period ? 'selected' : ''}`}
            onClick={() => handlePeriodClick(period)}
          >
            <h3>{period.charAt(0).toUpperCase() + period.slice(1)}ly</h3>
            {calculateTotal(period).map((total, index) => (
              <p key={index}>{total}</p>
            ))}
          </div>
        ))}
      </div>

      <h2 className="detail-summaries-title">
        Detail Summaries <span className={`period-badge ${selectedPeriod}`}>{selectedPeriod}</span>
      </h2>
      <div className="account-totals-grid">
        {Object.entries(accountTotals).map(([account, currencies], index) => (
          <div key={index} className="account-total-card">
            <h3>
              <FontAwesomeIcon icon={faCreditCard} className="credit-card-icon" />{' '}
              {account}
            </h3>
            <div className="account-totals">
              {Object.entries(currencies).map(([curr, totals], currIndex) => (
                <div key={currIndex} className={`account-total ${selectedPeriod}`}>
                  <p>
                    <span className="currency-symbol">{getSymbolFromCurrency(curr) || '$'}</span>
                    {totals[selectedPeriod].toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Totals;
