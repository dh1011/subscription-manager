import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import styles from './ConfigurationModal.module.css';
import getSymbolFromCurrency from 'currency-symbol-map/currency-symbol-map';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
const currencyList = require('currency-symbol-map/map');

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  showCurrencySymbol: boolean;
  ntfyTopic: string;
  ntfyDomain: string;
  backgroundUrl?: string;
  onSave: (config: {
    currency: string;
    ntfyTopic: string;
    ntfyDomain: string;
    showCurrencySymbol: boolean;
    backgroundUrl?: string;
  }) => void;
}

function ConfigurationModal({ 
  isOpen, 
  onClose, 
  currency, 
  showCurrencySymbol, 
  ntfyTopic, 
  ntfyDomain, 
  backgroundUrl = 'https://cdn.midjourney.com/1f46fbfe-102d-49d8-aa96-b54f1ea9a19a/0_0.png',
  onSave 
}: ConfigurationModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [topic, setTopic] = useState(ntfyTopic);
  const [domain, setDomain] = useState(ntfyDomain);
  const [searchTerm, setSearchTerm] = useState('');
  const [testStatus, setTestStatus] = useState<'success' | 'error' | null>(null);
  const [selectedShowCurrencySymbol, setSelectedShowCurrencySymbol] = useState(showCurrencySymbol);
  const [selectedBackgroundUrl, setSelectedBackgroundUrl] = useState(backgroundUrl);

  useEffect(() => {
    if (isOpen) {
      setSelectedCurrency(currency);
      setTopic(ntfyTopic);
      setDomain(ntfyDomain);
      setSelectedBackgroundUrl(backgroundUrl);
    }
  }, [isOpen, currency, ntfyTopic, ntfyDomain, backgroundUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      currency: selectedCurrency,
      ntfyTopic: topic,
      ntfyDomain: domain,
      showCurrencySymbol: selectedShowCurrencySymbol,
      backgroundUrl: selectedBackgroundUrl
    });
  };

  const handleTestNtfy = async () => {
    if (!topic || !domain) {
      setTestStatus('error');
      console.error('NTFY topic and domain are required');
      return;
    }
    
    try {
      // Make sure domain doesn't have trailing slash
      const cleanDomain = domain.endsWith('/') ? domain.slice(0, -1) : domain;
      await axios.post(`${cleanDomain}/${topic}`, 'Test notification from Subscription Manager');
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <motion.div
        className={styles.modalContainer}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h2>Configuration</h2>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.configSection}>
            <h3>Currency Settings</h3>
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
                onChange={(e) => setSelectedCurrency(e.target.value)}
                size={5}
              >
                {selectedCurrencyOption && !filteredCurrencies.some(([code]) => code === selectedCurrency) && (
                  <option key={selectedCurrencyOption[0]} value={selectedCurrencyOption[0]}>
                    {selectedCurrencyOption[0]} - {selectedCurrencyOption[1] as string} ({getSymbolFromCurrency(selectedCurrencyOption[0]) || 'N/A'})
                  </option>
                )}
                
                {filteredCurrencies.map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} - {name as string} ({getSymbolFromCurrency(code) || 'N/A'})
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.switchLabel}>
                <div className={styles.toggleSwitch}>
                  <input
                    type="checkbox"
                    checked={selectedShowCurrencySymbol}
                    onChange={(e) => setSelectedShowCurrencySymbol(e.target.checked)}
                  />
                  <span className={styles.toggleSlider}></span>
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
          
          <div className={styles.configSection}>
            <h3>Notification Settings</h3>
            <div className={styles.formGroup}>
              <label htmlFor="ntfyTopic">NTFY Topic</label>
              <input
                id="ntfyTopic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter your NTFY topic"
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="ntfyDomain">NTFY Domain</label>
              <input
                id="ntfyDomain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="Enter your NTFY domain"
              />
            </div>
            <button type="button" onClick={handleTestNtfy} className={styles.testButton}>
              Test NTFY
            </button>
            {testStatus && (
              <p className={`${styles.testStatus} ${styles[testStatus]}`}>
                {testStatus === 'success' ? 'Test notification sent successfully!' : 'Failed to send test notification.'}
              </p>
            )}
          </div>
          
          <div className={styles.configSection}>
            <h3>Appearance Settings</h3>
            <div className={styles.formGroup}>
              <label htmlFor="backgroundUrl">Background Image URL</label>
              <input
                id="backgroundUrl"
                type="text"
                value={selectedBackgroundUrl}
                onChange={(e) => setSelectedBackgroundUrl(e.target.value)}
                placeholder="Enter a URL for the background image"
              />
              {selectedBackgroundUrl && (
                <div className={styles.backgroundPreview}>
                  <img 
                    src={selectedBackgroundUrl} 
                    alt="Background preview" 
                    onError={(e) => e.currentTarget.style.display = 'none'} 
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.modalActions}>
            <button type="submit" className={styles.submitButton}>
              Save
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

export default ConfigurationModal; 