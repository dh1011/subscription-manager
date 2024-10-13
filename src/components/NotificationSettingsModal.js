import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './NotificationSettingsModal.css';

function NotificationSettingsModal({ isOpen, onClose }) {
  const [service, setService] = useState('ntfy');
  const [ntfyTopic, setNtfyTopic] = useState('');
  const [ntfyDomain, setNtfyDomain] = useState('https://ntfy.sh');
  const [gotifyUrl, setGotifyUrl] = useState('');
  const [gotifyToken, setGotifyToken] = useState('');

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  const fetchNotificationSettings = async () => {
    try {
      const response = await axios.get('/api/notification-settings');
      setService(response.data.service || 'ntfy');
      setNtfyTopic(response.data.ntfy_topic || '');
      setNtfyDomain(response.data.ntfy_domain || 'https://ntfy.sh');
      setGotifyUrl(response.data.gotify_url || '');
      setGotifyToken(response.data.gotify_token || '');
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/notification-settings', {
        service,
        ntfy_topic: ntfyTopic,
        ntfy_domain: ntfyDomain,
        gotify_url: gotifyUrl,
        gotify_token: gotifyToken
      });
      onClose();
    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  };

  const testNotification = async () => {
    try {
      if (service === 'ntfy') {
        await axios.post(`${ntfyDomain}/${ntfyTopic}`, 'Test notification from Subscription Manager');
      } else if (service === 'gotify') {
        await axios.post(`${gotifyUrl}/message`, {
          message: 'Test notification from Subscription Manager',
          title: 'Test Notification',
          priority: 5
        }, {
          headers: {
            'X-Gotify-Key': gotifyToken
          }
        });
      }
      alert('Test notification sent successfully!');
    } catch (error) {
      alert('Failed to send test notification. Please check your settings.');
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
        <h2>Notification Settings</h2>
        <p>Set your notification service and details</p>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="service">Notification Service</label>
            <select
              id="service"
              value={service}
              onChange={(e) => setService(e.target.value)}
            >
              <option value="ntfy">NTFY</option>
              <option value="gotify">Gotify</option>
            </select>
          </div>
          {service === 'ntfy' && (
            <>
              <div className="form-group">
                <label htmlFor="ntfyTopic">NTFY Topic</label>
                <input
                  id="ntfyTopic"
                  type="text"
                  value={ntfyTopic}
                  onChange={(e) => setNtfyTopic(e.target.value)}
                  placeholder="Enter your NTFY topic"
                />
              </div>
              <div className="form-group">
                <label htmlFor="ntfyDomain">NTFY Domain</label>
                <input
                  id="ntfyDomain"
                  type="text"
                  value={ntfyDomain}
                  onChange={(e) => setNtfyDomain(e.target.value)}
                  placeholder="Enter your NTFY domain"
                />
              </div>
            </>
          )}
          {service === 'gotify' && (
            <>
              <div className="form-group">
                <label htmlFor="gotifyUrl">Gotify URL</label>
                <input
                  id="gotifyUrl"
                  type="text"
                  value={gotifyUrl}
                  onChange={(e) => setGotifyUrl(e.target.value)}
                  placeholder="Enter your Gotify server URL"
                />
              </div>
              <div className="form-group">
                <label htmlFor="gotifyToken">Gotify Token</label>
                <input
                  id="gotifyToken"
                  type="text"
                  value={gotifyToken}
                  onChange={(e) => setGotifyToken(e.target.value)}
                  placeholder="Enter your Gotify application token"
                />
              </div>
            </>
          )}
          <div className="modal-actions">
            <button type="submit" className="submit-button">
              Save
            </button>
            <button type="button" onClick={testNotification} className="test-button">
              Test
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

export default NotificationSettingsModal;