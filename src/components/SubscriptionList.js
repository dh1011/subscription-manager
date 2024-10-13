// src/components/SubscriptionList.js
import React from 'react';
import './SubscriptionList.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faBell } from '@fortawesome/free-solid-svg-icons';
import getSymbolFromCurrency from 'currency-symbol-map/currency-symbol-map';

function SubscriptionList({ subscriptions, onEdit, onDelete, currency }) {
  const currencySymbol = getSymbolFromCurrency(currency) || '$';

  return (
    <div className="subscription-list-container">
      <h2 className="subscription-list-title">Subscriptions List</h2>
      <div className="subscription-list-grid">
        <div className="subscription-card">
          <div className="subscription-card-content">
            <div className="subscription-scroll-area">
              <ul className="subscription-list">
                <AnimatePresence>
                  {subscriptions.map((sub) => (
                    <motion.li
                      key={sub.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="subscription-item">
                        <div className="subscription-item-info">
                          <FontAwesomeIcon
                            icon={['fa', sub.icon]}
                            className="subscription-item-icon"
                            style={{ color: sub.color }}
                          />
                          <div>
                            <p className="subscription-item-name">{sub.name}</p>
                            <p className="subscription-item-amount">
                              {currencySymbol}{parseFloat(sub.amount).toFixed(2)}/month
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