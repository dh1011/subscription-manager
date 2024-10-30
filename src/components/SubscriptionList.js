// src/components/SubscriptionList.js
import React, { useState } from 'react';
import './SubscriptionList.css';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify-icon/react';
import getSymbolFromCurrency from 'currency-symbol-map/currency-symbol-map';
import { parseISO, addDays, addWeeks, addMonths, addYears, format } from 'date-fns';

function getNextDueDate(subscription) {
  const today = new Date();
  let dueDate = parseISO(subscription.due_date);
  const intervalValue = parseInt(subscription.interval_value) || 1;
  const intervalUnit = subscription.interval_unit || 'months';

  while (dueDate <= today) {
    switch (intervalUnit) {
      case 'days':
        dueDate = addDays(dueDate, intervalValue);
        break;
      case 'weeks':
        dueDate = addWeeks(dueDate, intervalValue);
        break;
      case 'months':
        dueDate = addMonths(dueDate, intervalValue);
        break;
      case 'years':
        dueDate = addYears(dueDate, intervalValue);
        break;
      default:
        return dueDate;
    }
  }

  return dueDate;
}

function SubscriptionList({ subscriptions, onEdit, onDelete, currency, onToggleInclude }) {
  const [sortBy, setSortBy] = useState('dueDate');
  const currencySymbol = getSymbolFromCurrency(currency) || '$';

  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    switch (sortBy) {
      case 'dueDate':
        return getNextDueDate(a).getTime() - getNextDueDate(b).getTime();
      case 'creditCard':
        return (a.account || '').localeCompare(b.account || '');
      case 'amount':
        return parseFloat(b.amount) - parseFloat(a.amount); // Changed to sort from large to small
      default:
        return 0;
    }
  });

  return (
    <div className="subscription-list-container">
      <div className="subscription-list-header">
        <h2 className="subscription-list-title">Subscriptions List</h2>
        <div className="subscription-list-controls">
          <label htmlFor="sort-select">Sort by: </label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="dueDate">Due Date</option>
            <option value="creditCard">Credit Card</option>
            <option value="amount">Amount</option>
          </select>
        </div>
      </div>
      <div className="subscription-list-grid">
        <div className="subscription-card">
          <div className="subscription-card-content">
            <div className="subscription-scroll-area">
              <ul className="subscription-list">
                <AnimatePresence>
                  {sortedSubscriptions.map((sub) => (
                    <motion.li
                      key={sub.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="subscription-item">
                        <div className="subscription-item-info">
                          <label className="subscription-item-checkbox-label">
                            <input
                              type="checkbox"
                              checked={sub.included}
                              onChange={() => onToggleInclude(sub.id)}
                              className="subscription-item-checkbox"
                            />
                          </label>
                          <Icon
                            icon={`mdi:${sub.icon}`}
                            className="subscription-item-icon"
                            style={{ color: sub.color }}
                          />
                          <div>
                            <p className="subscription-item-name">{sub.name}</p>
                            <p className="subscription-item-amount">
                              <span className="currency-symbol">
                                {getSymbolFromCurrency(sub.currency) || '$'}
                              </span>
                              {parseFloat(sub.amount).toFixed(2)}/{sub.interval_value} {sub.interval_unit}
                            </p>
                          </div>
                        </div>
                        <div className="subscription-item-details">
                          <div className="subscription-item-details-row">
                            <Icon icon="mdi:credit-card" className="credit-card-icon" />
                            <span>{sub.account || 'Not Specified'}</span>
                          </div>
                          <div className="subscription-item-indicators">
                            <span className="subscription-item-due-date-badge">
                              <span className="due-date">{format(getNextDueDate(sub), 'MMM d, yyyy')}</span>
                            </span>
                            {sub.autopay === 1 && (
                              <span className="autopay-indicator">
                                <Icon icon="mdi:auto-pay" className="autopay-icon" />
                                Autopay
                              </span>
                            )}
                            {sub.notify === 1 && (
                              <span className="notify-indicator">
                                <Icon icon="mdi:bell" className="notify-icon" />
                                Notify
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="subscription-item-actions">
                          <button onClick={() => onEdit(sub)}>
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(sub.id)}
                            className="delete-button"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionList;
