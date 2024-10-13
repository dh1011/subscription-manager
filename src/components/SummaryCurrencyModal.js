import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './CurrencySettingsModal.css'; // Reuse the existing CSS
import { supportedCurrencies } from '../currencyData';

function SummaryCurrencyModal({ isOpen, onClose, currentCurrency, onSave }) {
  const [selectedCurrency, setSelectedCurrency] = useState(currentCurrency);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/user-configuration', { summary_currency: selectedCurrency });
      onSave(selectedCurrency);
    } catch (error) {
      console.error('Error saving summary currency:', error);
    }
  };

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
        <h2>Summary Currency Settings</h2>
        <p>Select the currency for summary calculations</p>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="summary-currency">Summary Currency</label>
            <select
              id="summary-currency"
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
            >
              {Object.entries(supportedCurrencies).map(([code, name]) => (
                <option key={code} value={code}>
                  {code} - {name}
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

export default SummaryCurrencyModal;
