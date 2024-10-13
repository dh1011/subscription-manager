import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './SubscriptionModal.css';

function OpenExchangeRatesModal({ isOpen, onClose, onSave, fetchExchangeRates }) {
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchApiKey();
    }
  }, [isOpen]);

  const fetchApiKey = async () => {
    try {
      const response = await axios.get('/api/open-exchange-rates-key');
      setApiKey(response.data.key);
    } catch (error) {
      console.error('Error fetching Open Exchange Rates API key:', error);
    }
  };

  const handleSave = async () => {
    try {
      await axios.post('/api/open-exchange-rates-key', { key: apiKey });
      await fetchExchangeRates(); // Fetch new exchange rates after saving the API key
      onSave();
    } catch (error) {
      console.error('Error saving Open Exchange Rates API key:', error);
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
        <h2>Open Exchange Rates API Key</h2>
        <p>Enter your API key for Open Exchange Rates</p>
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="modal-form">
          <div className="form-group">
            <label htmlFor="apiKey">API Key</label>
            <input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
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

export default OpenExchangeRatesModal;
