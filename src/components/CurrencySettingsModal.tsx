import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import styles from './CurrencySettingsModal.module.css';
import getSymbolFromCurrency from 'currency-symbol-map';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;
const currencyList = require('currency-symbol-map/map');

interface CurrencySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCurrency: string;
  onSave: (currency: string) => void;
}

function CurrencySettingsModal({ isOpen, onClose, currentCurrency, onSave }: CurrencySettingsModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);
  const [searchTerm, setSearchTerm] = useState('');

  // Reset selectedCurrency when the modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedCurrency(currentCurrency);
    }
  }, [isOpen, currentCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/user-configuration`, { currency: selectedCurrency });
      onSave(selectedCurrency);
    } catch (error) {
      console.error('Error saving currency:', error);
    }
  };

  // Filter currencies based on the search term
  const filteredCurrencies = Object.entries(currencyList).filter(([code, name]) =>
    `${code} ${name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCurrency(e.target.value);
  };

  // Ensure selected currency is always visible in the list, even after search
  const selectedCurrencyOption = Object.entries(currencyList).find(
    ([code]) => code === selectedCurrency
  );

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2>Currency Settings</h2>
        <p>Select your preferred currency</p>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="currency-search">Search Currency</label>
            <input
              id="currency-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by currency code or name"
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={selectedCurrency}
              onChange={handleCurrencyChange}
              size={5}
            >
              {/* Ensure the selected currency is always an option */}
              {selectedCurrencyOption && !filteredCurrencies.some(([code]) => code === selectedCurrency) && (
                <option key={selectedCurrencyOption[0]} value={selectedCurrencyOption[0]}>
                  {selectedCurrencyOption[0]} - {selectedCurrencyOption[1]} ({getSymbolFromCurrency(selectedCurrencyOption[0]) || 'N/A'})
                </option>
              )}
              
              {/* Render filtered currency options */}
              {filteredCurrencies.map(([code, name]) => (
                <option key={code} value={code}>
                  {code} - {name} ({getSymbolFromCurrency(code) || 'N/A'})
                </option>
              ))}
            </select>
          </div>
          <div className={styles.modalActions}>
            <button 
              type="submit" 
              className={`${styles.button} ${styles.primary}`}
            >
              Save
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className={`${styles.button} ${styles.secondary}`}
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default CurrencySettingsModal; 