// src/components/ConfigurationModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './ConfigurationModal.css';
import getSymbolFromCurrency from 'currency-symbol-map/currency-symbol-map';

const currencyList = require('currency-symbol-map/map');

function ConfigurationModal({ isOpen, onClose, currency, showCurrencySymbol, ntfyTopic, ntfyDomain, onSave }) {
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [topic, setTopic] = useState(ntfyTopic);
  const [domain, setDomain] = useState(ntfyDomain);
  const [searchTerm, setSearchTerm] = useState('');
  const [testStatus, setTestStatus] = useState(null);
  const [selectedShowCurrencySymbol, setSelectedShowCurrencySymbol] = useState(showCurrencySymbol);

  useEffect(() => {
    if (isOpen) {
      setSelectedCurrency(currency);
      setTopic(ntfyTopic);
      setDomain(ntfyDomain);
    }
  }, [isOpen, currency, ntfyTopic, ntfyDomain]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/ntfy-settings', { topic, domain });
      onSave({
        currency: selectedCurrency,
        ntfyTopic: topic,
        ntfyDomain: domain,
        showCurrencySymbol: selectedShowCurrencySymbol
      });
    } catch (error) {
      console.error('Error saving NTFY settings:', error);
    }
  };

  const handleTestNtfy = async () => {
    try {
      await axios.post(`${domain}/${topic}`, 'Test notification from Subscription Manager');
      setTestStatus('success');
    } catch (error) {
      setTestStatus('error');
      console.error('Failed to send test notification:', error);
    }
  };

  const filteredCurrencies = Object.entries(currencyList).filter(([code, name]) =>
    `${code} ${name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCurrencyOption = Object.entries(currencyList).find(
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
        <h2>Configuration</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="config-section">
            <h3>Currency Settings</h3>
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
                onChange={(e) => setSelectedCurrency(e.target.value)}
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
            <div className="form-group">
              <label className="switch-label">
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={selectedShowCurrencySymbol}
                    onChange={(e) => setSelectedShowCurrencySymbol(e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </div>
                <span style={{ paddingLeft: '10px' }}>
                  {selectedShowCurrencySymbol 
                    ? `Symbol (${getSymbolFromCurrency(selectedCurrency) || 'N/A'})` 
                    : `Code (${selectedCurrency})`
                  }
                </span>
              </label>
            </div>
          </div>
          
          <div className="config-section">
            <h3>Notification Settings</h3>
            <div className="form-group">
              <label htmlFor="ntfyTopic">NTFY Topic</label>
              <input
                id="ntfyTopic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter your NTFY topic"
              />
            </div>
            <div className="form-group">
              <label htmlFor="ntfyDomain">NTFY Domain</label>
              <input
                id="ntfyDomain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Enter your NTFY domain"
              />
            </div>
            <button type="button" onClick={handleTestNtfy} className="test-button">
              Test NTFY
            </button>
            {testStatus && (
              <p className={`test-status ${testStatus}`}>
                {testStatus === 'success' ? 'Test notification sent successfully!' : 'Failed to send test notification.'}
              </p>
            )}
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

export default ConfigurationModal;
