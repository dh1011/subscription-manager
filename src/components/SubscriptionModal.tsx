'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify-icon/react';
import getSymbolFromCurrency from 'currency-symbol-map';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import '@/styles/react-datepicker-dark.css';
import { parseISO } from 'date-fns';
import { Subscription } from '@/types';
import { getRandomColor } from '@/lib/utils';
import styles from './SubscriptionModal.module.css';

const currencyList = require('currency-symbol-map/map');

interface Props {
  onClose: () => void;
  onSave: (subscription: Subscription) => void;
  selectedSubscription?: Subscription;
  selectedDate?: Date;
  defaultCurrency: string;
}

export default function SubscriptionModal({
  onClose,
  onSave,
  selectedSubscription,
  selectedDate,
  defaultCurrency
}: Props) {
  const [id, setId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [icon, setIcon] = useState('');
  const [iconInput, setIconInput] = useState('');
  const [color, setColor] = useState('');
  const [account, setAccount] = useState('');
  const [autopay, setAutopay] = useState(false);
  const [intervalValue, setIntervalValue] = useState(1);
  const [intervalUnit, setIntervalUnit] = useState('months');
  const [notify, setNotify] = useState(false);
  const [currency, setCurrency] = useState(defaultCurrency);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    if (selectedSubscription) {
      setId(selectedSubscription.id || null);
      setName(selectedSubscription.name);
      setAmount(selectedSubscription.amount.toString());
      setDueDate(selectedSubscription.dueDate
        ? parseISO(selectedSubscription.dueDate)
        : (selectedSubscription.due_date
          ? parseISO(selectedSubscription.due_date)
          : null));
      setIcon(selectedSubscription.icon || '');
      setIconInput(selectedSubscription.icon || '');
      setColor(selectedSubscription.color || '');
      setAccount(selectedSubscription.account || '');
      setAutopay(selectedSubscription.autopay);
      setIntervalValue(selectedSubscription.intervalValue || selectedSubscription.interval_value || 1);
      setIntervalUnit(selectedSubscription.intervalUnit || selectedSubscription.interval_unit || 'months');
      setNotify(selectedSubscription.notify);
      setCurrency(selectedSubscription.currency);
      setTags(selectedSubscription.tags || []);
      setTagInput(selectedSubscription.tags ? selectedSubscription.tags.join(', ') : '');
    } else {
      if (selectedDate) {
        setDueDate(selectedDate);
      }
      setColor(getRandomColor());
      setIntervalValue(1);
      setIntervalUnit('months');
      setAccount('');
      setCurrency(defaultCurrency);
      setTags([]);
      setTagInput('');
    }
  }, [selectedSubscription, selectedDate, defaultCurrency]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    // Check validation for required fields
    const newErrors: {[key: string]: boolean} = {};
    if (!name.trim()) newErrors.name = true;
    if (!amount.trim() || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) newErrors.amount = true;
    if (!dueDate) newErrors.dueDate = true;
    if (!icon) newErrors.icon = true;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert('Please fill in all required fields.');
      return;
    }
    
    const subscription: Subscription = {
      id: id || undefined,
      name,
      amount: parseFloat(amount),
      dueDate: dueDate!.toISOString().split('T')[0],
      icon,
      color,
      account,
      autopay,
      intervalValue: intervalValue ? parseInt(String(intervalValue)) : 1,
      intervalUnit: intervalUnit || 'months',
      notify,
      currency: currency === defaultCurrency ? 'default' : currency,
      tags
    };
    onSave(subscription);
    onClose();
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIconInput(e.target.value);
    setIcon(e.target.value.toLowerCase());
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
    // Update tags when the input changes, split by commas and trim whitespace
    if (e.target.value.trim()) {
      const tagArray = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      setTags(tagArray);
    } else {
      setTags([]);
    }
  };

  const formatDate = (date: Date | null) => {
    return date
      ? date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      : 'Select billing date';
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2>{id ? 'Edit Subscription' : 'Add New Subscription'}</h2>
        <p>Enter the details of your subscription</p>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Subscription Name <span style={{ color: '#ff4444' }}>*</span></label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter subscription name"
              style={errors.name ? { border: '1px solid #ff4444', boxShadow: '0 0 5px rgba(255, 68, 68, 0.3)' } : {}}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="amount">Recurring Amount <span style={{ color: '#ff4444' }}>*</span></label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              step="0.01"
              style={errors.amount ? { border: '1px solid #ff4444', boxShadow: '0 0 5px rgba(255, 68, 68, 0.3)' } : {}}
            />
          </div>
          <div className={`${styles.formGroup} ${styles.datePickerGroup}`}>
            <label htmlFor="dueDate">Billing Date</label>
            <DatePicker
              id="dueDate"
              selected={dueDate}
              onChange={(date: Date | null) => date && setDueDate(date)}
              dateFormat="d MMM yyyy"
              customInput={
                <button 
                  type="button" 
                  className={styles.datePickerButton}
                  style={errors.dueDate ? { border: '1px solid #ff4444', boxShadow: '0 0 5px rgba(255, 68, 68, 0.3)' } : {}}
                >
                  {formatDate(dueDate)}
                </button>
              }
              className="dark-theme-datepicker"
              calendarClassName="dark-theme-calendar"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="icon">Icon <span style={{ color: '#ff4444' }}>*</span></label>
            <div className={styles.iconInputContainer}>
              <input
                id="icon"
                type="text"
                value={iconInput}
                onChange={handleIconChange}
                placeholder="Enter Material Design Icon name"
                style={errors.icon ? { border: '1px solid #ff4444', boxShadow: '0 0 5px rgba(255, 68, 68, 0.3)' } : {}}
              />
              <span className={styles.iconPreview}>
                <Icon icon={`mdi:${icon || 'help-circle'}`} />
              </span>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="interval">Recurrence Interval</label>
            <div className={styles.intervalInputContainer}>
              <input
                id="intervalValue"
                type="number"
                value={intervalValue}
                onChange={(e) => setIntervalValue(parseInt(e.target.value))}
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
          <div className={styles.formGroup}>
            <label htmlFor="account">Payment Account</label>
            <input
              id="account"
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="Enter account or card name"
            />
          </div>
          <div className={`${styles.formGroup} ${styles.autopayToggle}`}>
            <label htmlFor="autopay">Autopay</label>
            <label className={styles.switch}>
              <input
                id="autopay"
                type="checkbox"
                checked={autopay}
                onChange={(e) => setAutopay(e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
          <div className={`${styles.formGroup} ${styles.notifyToggle}`}>
            <label htmlFor="notify">Notify</label>
            <label className={styles.switch}>
              <input
                id="notify"
                type="checkbox"
                checked={notify}
                onChange={(e) => setNotify(e.target.checked)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
          <div className={styles.formGroup}>
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
          <div className={styles.formGroup}>
            <label htmlFor="tags">Tags (comma separated)</label>
            <input
              id="tags"
              type="text"
              value={tagInput}
              onChange={handleTagChange}
              placeholder="e.g. streaming, entertainment, monthly"
            />
            {tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '8px', gap: '4px' }}>
                {tags.map((tag, index) => (
                  <span key={index} style={{
                    backgroundColor: 'rgba(255, 140, 0, 0.2)',
                    color: '#FF8C00',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '0.8em'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className={styles.modalActions}>
            <button type="submit" className={styles.submitButton}>
              {id ? 'Update Subscription' : 'Add Subscription'}
            </button>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
} 