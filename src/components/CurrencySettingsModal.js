import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './CurrencySettingsModal.css';
import getSymbolFromCurrency from 'currency-symbol-map/currency-symbol-map';
import { supportedCurrencies } from '../currencyData';

function CurrencySettingsModal({ isOpen, onClose, currentCurrency, onSave }) {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedCurrency(currentCurrency);
    }
  }, [isOpen, currentCurrency]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/user-configuration', { currency: selectedCurrency });
      onSave(selectedCurrency);
    } catch (error) {
      console.error('Error saving currency:', error);
    }
  };

  const filteredCurrencies = Object.entries(supportedCurrencies).filter(([code, name]) =>
    `${code} ${name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCurrencyChange = (e) => {
    setSelectedCurrency(e.target.value);
  };

  const selectedCurrencyOption = Object.entries(supportedCurrencies).find(
    ([code]) => code === selectedCurrency
  );

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2>Currency Settings</h2>
        <p>Select your preferred currency</p>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="currency-search">Search Currency</label>
            <input
              id="currency-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by currency code or name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="currency">Currency</label>
            <select
              id="currency"
              value={selectedCurrency}
              onChange={handleCurrencyChange}
              size={5}
            >
              {selectedCurrencyOption && !filteredCurrencies.some(([code]) => code === selectedCurrency) && (
                <option key={selectedCurrencyOption[0]} value={selectedCurrencyOption[0]}>
                  {selectedCurrencyOption[0]} - {selectedCurrencyOption[1]} ({getSymbolFromCurrency(selectedCurrencyOption[0]) || 'N/A'})
                </option>
              )}
              
              {filteredCurrencies.map(([code, name]) => (
                <option key={code} value={code}>
                  {code} - {name} ({getSymbolFromCurrency(code) || 'N/A'})
                </option>
              ))}
            </select>
          </div>
          <div className="modal-actions">
            <button type="submit" className="submit-button">
              Save
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

export default CurrencySettingsModal;
