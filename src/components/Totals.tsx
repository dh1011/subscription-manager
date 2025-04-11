import React, { useState, useEffect, useMemo } from 'react';
import './Totals.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard } from '@fortawesome/free-solid-svg-icons';
import getSymbolFromCurrency from 'currency-symbol-map';
import { Subscription as AppSubscription } from '@/types';

// Standalone interface for internal use
interface TotalsSubscription {
  id?: number | string;
  amount: number | string;
  interval_value?: string;
  intervalValue?: number;
  interval_unit?: 'days' | 'weeks' | 'months' | 'years';
  intervalUnit?: string;
  currency: string;
  account?: string;
  included?: boolean;
}

interface TotalsProps {
  subscriptions: AppSubscription[];
  currency: string;
  showCurrencySymbol: boolean;
  selectedTags?: string[];
}

function Totals({ subscriptions, currency, showCurrencySymbol, selectedTags }: TotalsProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [defaultCurrency, setDefaultCurrency] = useState(currency);

  // Get all unique tags that are in the current subscription set
  const currentTags = useMemo(() => {
    const tagSet = new Set<string>();
    subscriptions.forEach(sub => {
      if (sub.tags && sub.tags.length > 0) {
        sub.tags.forEach(tag => tagSet.add(tag));
      }
    });
    return Array.from(tagSet).sort();
  }, [subscriptions]);

  // Update defaultCurrency if the prop changes
  useEffect(() => {
    setDefaultCurrency(currency);
  }, [currency]);

  const formatCurrency = (amount: number, currencyCode: string): string => {
    if (showCurrencySymbol) {
      const symbol = getSymbolFromCurrency(currencyCode) || '$';
      return `${symbol}${amount.toFixed(2)}`;
    } else {
      return `${amount.toFixed(2)} ${currencyCode}`;
    }
  };

  const calculateTotal = (period: 'week' | 'month' | 'year') => {
    const totals: { [key: string]: number } = {};
    subscriptions.forEach((sub) => {
      if (sub.included === false) return; // Skip if explicitly not included
      
      // Handle both string and number amounts
      const amount = typeof sub.amount === 'string' 
        ? parseFloat(sub.amount || '0') 
        : (sub.amount || 0);
      
      // Handle different property naming conventions
      const intervalValue = sub.interval_value 
        ? parseInt(String(sub.interval_value)) 
        : (sub.intervalValue || 1);
      
      const intervalUnit = sub.interval_unit || sub.intervalUnit || 'months';
      
      // Use the subscription's currency directly since the API already
      // replaces 'default' with the actual currency value
      const subCurrency = sub.currency || defaultCurrency;
      
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
      }
    });

    return Object.entries(totals).map(([curr, total]) => (
      <span key={curr}>
        {formatCurrency(total, curr)}
      </span>
    ));
  };

  interface AccountTotal {
    week: number;
    month: number;
    year: number;
  }

  interface AccountTotals {
    [account: string]: {
      [currency: string]: AccountTotal;
    };
  }

  const accountTotals = subscriptions.reduce<AccountTotals>((acc, sub) => {
    if (sub.included === false) return acc;
    
    const account = sub.account || 'Unspecified';
    // Use the subscription's currency directly
    const subCurrency = sub.currency || defaultCurrency;
    
    if (!acc[account]) {
      acc[account] = {};
    }
    if (!acc[account][subCurrency]) {
      acc[account][subCurrency] = { week: 0, month: 0, year: 0 };
    }

    // Handle both string and number amounts
    const amount = typeof sub.amount === 'string' 
      ? parseFloat(sub.amount || '0') 
      : (sub.amount || 0);
    
    // Handle different property naming conventions
    const intervalValue = sub.interval_value 
      ? parseInt(String(sub.interval_value)) 
      : (sub.intervalValue || 1);
    
    const intervalUnit = sub.interval_unit || sub.intervalUnit || 'months';

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

  const handlePeriodClick = (period: 'week' | 'month' | 'year') => {
    setSelectedPeriod(period);
  };

  return (
    <div className="totals glass-morphism">
      <div className="totals-grid">
        {(['week', 'month', 'year'] as const).map((period) => (
          <div
            key={period}
            className={`total-card glass-card ${period}ly ${selectedPeriod === period ? 'selected' : ''}`}
            onClick={() => handlePeriodClick(period)}
          >
            <div className="period-label">{period.charAt(0).toUpperCase() + period.slice(1)}ly</div>
            {calculateTotal(period).map((total, index) => (
              <p key={index} className="amount">{total}</p>
            ))}
          </div>
        ))}
      </div>
      
      <div className="account-totals-grid">
        {Object.entries(accountTotals).map(([account, currencies], index) => (
          <div key={index} className="account-total-card glass-card">
            <div className="account-label">
              <FontAwesomeIcon icon={faCreditCard} className="credit-card-icon" />{' '}
              {account}
            </div>
            <div className="account-totals">
              {Object.entries(currencies).map(([curr, totals], currIndex) => (
                <div key={currIndex} className={`account-total ${selectedPeriod}`}>
                  <p>{formatCurrency(totals[selectedPeriod], curr)}</p>
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