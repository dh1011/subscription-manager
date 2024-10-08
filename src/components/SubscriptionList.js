// src/components/SubscriptionList.js
import React from 'react';
import './SubscriptionList.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faBell } from '@fortawesome/free-solid-svg-icons';
import { parseISO, addDays, addWeeks, addMonths, addYears } from 'date-fns';

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

function SubscriptionList({ subscriptions, onEdit, onDelete, onToggleInclude }) {
  const sortedSubscriptions = [...subscriptions].sort((a, b) => {
    const nextDueDateA = getNextDueDate(a);
    const nextDueDateB = getNextDueDate(b);
    return nextDueDateA.getTime() - nextDueDateB.getTime();
  });

  return (
    <div className="subscription-list-container">
      <h2 className="subscription-list-title">Subscriptions List</h2>
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
                          <FontAwesomeIcon
                            icon={['fa', sub.icon]}
                            className="subscription-item-icon"
                            style={{ color: sub.color }}
                          />
                          <div>
                            <p className="subscription-item-name">{sub.name}</p>
                            <p className="subscription-item-amount">
                              ${parseFloat(sub.amount).toFixed(2)}/month
                            </p>
                          </div>
                        </div>
                        <div className="subscription-item-details">
                          <FontAwesomeIcon icon={faCreditCard} className="credit-card-icon" />
                          <span>{sub.account || 'Not Specified'}</span>
                          {sub.autopay === 1 && (
                            <span className="autopay-indicator">
                              Autopay
                            </span>
                          )}
                          {sub.notify === 1 && (
                            <span className="notify-indicator">
                              <FontAwesomeIcon icon={faBell} className="notify-icon" />
                            </span>
                          )}
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