// src/components/SubscriptionModal.js
import React, { useState, useEffect } from 'react';
import './SubscriptionModal.css';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { getRandomColor } from './utils/colorUtils';
import getSymbolFromCurrency from 'currency-symbol-map/currency-symbol-map';

const currencyList = require('currency-symbol-map/map');

function SubscriptionModal({ onClose, onSave, selectedSubscription, selectedDate, defaultCurrency }) {
  const [id, setId] = useState(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [icon, setIcon] = useState('');
  const [iconInput, setIconInput] = useState('');
  const [color, setColor] = useState('');
  const [account, setAccount] = useState('');
  const [autopay, setAutopay] = useState(false);
  const [intervalValue, setIntervalValue] = useState(1);
  const [intervalUnit, setIntervalUnit] = useState('months');
  const [notify, setNotify] = useState(false);
  const [currency, setCurrency] = useState(defaultCurrency);

  useEffect(() => {
    if (selectedSubscription) {
      setId(selectedSubscription.id || null);
      setName(selectedSubscription.name || '');
      setAmount(selectedSubscription.amount || '');
      setDueDate(
        selectedSubscription.due_date
          ? new Date(selectedSubscription.due_date).toISOString().split('T')[0]
          : ''
      );
      setIcon(selectedSubscription.icon || '');
      setIconInput(selectedSubscription.icon || '');
      setColor(selectedSubscription.color || '');
      setAccount(selectedSubscription.account || '');
      setAutopay(selectedSubscription.autopay || false);
      setIntervalValue(selectedSubscription.interval_value || 1);
      setIntervalUnit(selectedSubscription.interval_unit || 'months');
      setNotify(selectedSubscription.notify || false);
      setCurrency(selectedSubscription.currency || defaultCurrency);
    } else {
      if (selectedDate) {
        setDueDate(selectedDate.toISOString().split('T')[0]);
      }
      setColor(getRandomColor());
      setIntervalValue(1);
      setIntervalUnit('months');
      setAccount('');
      setCurrency(defaultCurrency);
    }
  }, [selectedSubscription, selectedDate, defaultCurrency]);

  const convertToMonthlyAmount = (amount, intervalValue, intervalUnit) => {
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) return 0;
    let paymentsPerMonth = 0;
    const interval = parseInt(intervalValue) || 1;
  
    switch (intervalUnit) {
      case 'days':
        paymentsPerMonth = 30.44 / interval;
        break;
      case 'weeks':
        paymentsPerMonth = 4.34524 / interval;
        break;
      case 'months':
        paymentsPerMonth = 1 / interval;
        break;
      case 'years':
        paymentsPerMonth = 1 / (interval * 12);
        break;
      default:
        paymentsPerMonth = 0;
        break;
    }
    return amountFloat * paymentsPerMonth;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name && amount && dueDate && icon) {
      const monthlyAmount = convertToMonthlyAmount(amount, intervalValue, intervalUnit);
      onSave({
        id,
        name,
        amount: monthlyAmount.toFixed(2),
        dueDate,
        icon,
        color,
        account,
        autopay,
        interval_value: parseInt(intervalValue) || 1,
        interval_unit: intervalUnit,
        notify,
        currency: currency === defaultCurrency ? 'default' : currency,
      });
      onClose();
    } else {
      alert('Please fill in all required fields.');
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
            <label htmlFor="amount">Recurring Amount</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Enter amount`}
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
          <label htmlFor="interval">Recurrence Interval</label>
            <div className="interval-input-container">
              <input
                id="intervalValue"
                type="number"
                value={intervalValue}
                onChange={(e) => setIntervalValue(e.target.value)}
                min="1"
                placeholder="Interval"
              />
              <select
                id="intervalUnit"
                value={intervalUnit}
                onChange={(e) => setIntervalUnit(e.target.value)}
              >
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
                <option value="years">Years</option>
              </select>
            </div>
          </div>
          <div className="form-group">
        <label htmlFor="account">Payment Account</label>
        <input
          id="account"
          type="text"
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          placeholder="Enter account or card name"
            />
          </div>
          <div className="form-group autopay-toggle">
            <label htmlFor="autopay">Autopay</label>
            <label className="switch">
              <input
                id="autopay"
                type="checkbox"
                checked={autopay}
                onChange={(e) => setAutopay(e.target.checked)}
              />
              <span className="slider"></span>
            </label>
          </div>
          <div className="form-group notify-toggle">
          <label htmlFor="notify">Notify</label>
          <label className="switch">
            <input
              id="notify"
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
        </div>
          <div className="form-group">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {Object.keys(currencyList).map((curr) => (
                <option key={curr} value={curr}>
                  {curr} ({getSymbolFromCurrency(curr) || 'N/A'})
                </option>
              ))}
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
