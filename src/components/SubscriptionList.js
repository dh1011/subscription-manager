// src/components/SubscriptionList.js
import React from 'react';
import './SubscriptionList.css';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

function SubscriptionList({ subscriptions, onEdit, onDelete }) {

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
                              ${parseFloat(sub.amount).toFixed(2)}/month
                            </p>
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
