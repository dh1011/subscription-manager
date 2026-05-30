import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import styles from './ConfigurationModal.module.css';
import getSymbolFromCurrency from 'currency-symbol-map/currency-symbol-map';
import { NotificationService } from '@/types';

const currencyList = require('currency-symbol-map/map');

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  showCurrencySymbol: boolean;
  notificationService: NotificationService;
  ntfyTopic: string;
  ntfyDomain: string;
  gotifyUrl: string;
  gotifyToken: string;
  onSave: (config: {
    currency: string;
    notificationService: NotificationService;
    ntfyTopic: string;
    ntfyDomain: string;
    gotifyUrl: string;
    gotifyToken: string;
    showCurrencySymbol: boolean;
  }) => void;
}

function ConfigurationModal({ 
  isOpen, 
  onClose, 
  currency, 
  showCurrencySymbol, 
  notificationService,
  ntfyTopic, 
  ntfyDomain, 
  gotifyUrl,
  gotifyToken,
  onSave 
}: ConfigurationModalProps) {
  const [selectedCurrency, setSelectedCurrency] = useState(currency);
  const [service, setService] = useState<NotificationService>(notificationService);
  const [topic, setTopic] = useState(ntfyTopic);
  const [domain, setDomain] = useState(ntfyDomain);
  const [selectedGotifyUrl, setSelectedGotifyUrl] = useState(gotifyUrl);
  const [selectedGotifyToken, setSelectedGotifyToken] = useState(gotifyToken);
  const [searchTerm, setSearchTerm] = useState('');
  const [testStatus, setTestStatus] = useState<'success' | 'error' | null>(null);
  const [selectedShowCurrencySymbol, setSelectedShowCurrencySymbol] = useState(showCurrencySymbol);

  useEffect(() => {
    if (isOpen) {
      setSelectedCurrency(currency);
      setService(notificationService);
      setTopic(ntfyTopic);
      setDomain(ntfyDomain);
      setSelectedGotifyUrl(gotifyUrl);
      setSelectedGotifyToken(gotifyToken);
      setTestStatus(null);
    }
  }, [isOpen, currency, notificationService, ntfyTopic, ntfyDomain, gotifyUrl, gotifyToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      currency: selectedCurrency,
      notificationService: service,
      ntfyTopic: topic,
      ntfyDomain: domain,
      gotifyUrl: selectedGotifyUrl,
      gotifyToken: selectedGotifyToken,
      showCurrencySymbol: selectedShowCurrencySymbol
    });
  };

  const handleTestNotification = async () => {
    if (service === 'ntfy' && (!topic || !domain)) {
      setTestStatus('error');
      console.error('NTFY topic and domain are required');
      return;
    }

    if (service === 'gotify' && (!selectedGotifyUrl || !selectedGotifyToken)) {
      setTestStatus('error');
      console.error('Gotify URL and token are required');
      return;
    }
    
    try {
      await axios.post('/api/test-notification', {
        service,
        topic,
        domain,
        gotifyUrl: selectedGotifyUrl,
        gotifyToken: selectedGotifyToken
      });
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
              <label htmlFor="notificationService">Service</label>
              <select
                id="notificationService"
                value={service}
                onChange={(e) => setService(e.target.value as NotificationService)}
              >
                <option value="ntfy">NTFY</option>
                <option value="gotify">Gotify</option>
              </select>
            </div>
            {service === 'ntfy' ? (
              <>
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
              </>
            ) : (
              <>
                <div className={styles.formGroup}>
                  <label htmlFor="gotifyUrl">Gotify URL</label>
                  <input
                    id="gotifyUrl"
                    type="text"
                    value={selectedGotifyUrl}
                    onChange={(e) => setSelectedGotifyUrl(e.target.value)}
                    placeholder="Enter your Gotify server URL"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="gotifyToken">Gotify Application Token</label>
                  <input
                    id="gotifyToken"
                    type="password"
                    value={selectedGotifyToken}
                    onChange={(e) => setSelectedGotifyToken(e.target.value)}
                    placeholder="Enter your Gotify application token"
                  />
                </div>
              </>
            )}
            <button type="button" onClick={handleTestNotification} className={styles.testButton}>
              Test Notification
            </button>
            {testStatus && (
              <p className={`${styles.testStatus} ${styles[testStatus]}`}>
                {testStatus === 'success' ? 'Test notification sent successfully!' : 'Failed to send test notification.'}
              </p>
            )}
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
