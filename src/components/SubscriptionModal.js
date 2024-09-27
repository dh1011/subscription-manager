// src/components/SubscriptionModal.js
import React, { useState, useEffect } from 'react';
import './SubscriptionModal.css';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getRandomColor } from './utils/colorUtils';

function SubscriptionModal({ onClose, onSave, selectedSubscription, selectedDate }) {
  const [id, setId] = useState(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [icon, setIcon] = useState('');
  const [recurrence, setRecurrence] = useState('monthly');
  const [iconInput, setIconInput] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (selectedSubscription) {
      setId(selectedSubscription.id || null);
      setName(selectedSubscription.name || '');
      setAmount(selectedSubscription.amount || '');
      setDueDate(selectedSubscription.due_date ? new Date(selectedSubscription.due_date).toISOString().split('T')[0] : '');
      setIcon(selectedSubscription.icon || '');
      setIconInput(selectedSubscription.icon || '');
      setRecurrence(selectedSubscription.recurrence || 'monthly');
      setColor(selectedSubscription.color || '');
    } else {
      if (selectedDate) {
        setDueDate(selectedDate.toISOString().split('T')[0]);
      }
      setColor(getRandomColor());
    }
  }, [selectedSubscription, selectedDate]);

  const getAmountLabel = () => {
    switch (recurrence) {
      case 'weekly':
        return 'Weekly Amount';
      case 'yearly':
        return 'Yearly Amount';
      default:
        return 'Monthly Amount';
    }
  };

  const convertToMonthlyAmount = (amount, recurrence) => {
    switch (recurrence) {
      case 'weekly':
        return (parseFloat(amount) * 52) / 12;
      case 'yearly':
        return parseFloat(amount) / 12;
      default:
        return parseFloat(amount);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && amount && dueDate && icon) {
      const monthlyAmount = convertToMonthlyAmount(amount, recurrence);
      onSave({ id, name, amount: monthlyAmount.toFixed(2), dueDate, icon, recurrence, color });
      onClose();
    } else {
      alert('Please fill in all fields.');
    }
  };

  const handleIconChange = (e) => {
    setIconInput(e.target.value);
    setIcon(e.target.value.toLowerCase());
  };

  const getIconElement = (iconName) => {
    try {
      if (iconName === '') {
        return <FontAwesomeIcon icon={['fa', 'question-circle']} />;
      }
      return <FontAwesomeIcon icon={['fa', iconName]} />;
    } catch {
      return <FontAwesomeIcon icon={['fa', 'question-circle']} />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2>{id ? 'Edit Subscription' : 'Add New Subscription'}</h2>
        <p>Enter the details of your subscription</p>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="name">Subscription Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter subscription name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="amount">{getAmountLabel()}</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter ${getAmountLabel().toLowerCase()}`}
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label htmlFor="dueDate">Billing Date</label>
            <input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="icon">Icon</label>
            <div className="icon-input-container">
              <input
                id="icon"
                type="text"
                value={iconInput}
                onChange={handleIconChange}
                placeholder="Enter Font Awesome brand icon name"
              />
              <span className="icon-preview">{getIconElement(icon)}</span>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="recurrence">Recurrence</label>
            <select
              id="recurrence"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value)}
            >
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="submit" className="submit-button">
              {id ? 'Update Subscription' : 'Add Subscription'}
            </button>
            <button type="button" onClick={onClose} className="cancel-button">
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default SubscriptionModal;
