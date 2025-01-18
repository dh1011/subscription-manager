import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './NtfySettingsModal.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

function NtfySettingsModal({ isOpen, onClose }) {
  const [ntfyTopic, setNtfyTopic] = useState('');
  const [ntfyDomain, setNtfyDomain] = useState('https://ntfy.sh');

  useEffect(() => {
    fetchNtfySettings();
  }, []);

  const fetchNtfySettings = async () => {
    try {
      const response = await axios.get('/api/ntfy-settings');
      setNtfyTopic(response.data.topic);
      setNtfyDomain(response.data.domain);
    } catch (error) {
      console.error('Error fetching NTFY settings:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE_URL}/api/ntfy-settings`, { topic: ntfyTopic, domain: ntfyDomain });
      onClose();
    } catch (error) {
      console.error('Error saving NTFY settings:', error);
    }
  };

  const testNtfyTopic = async () => {
    try {
      await axios.post(`${ntfyDomain}/${ntfyTopic}`, 'Test notification from Subscription Manager');
      alert('Test notification sent successfully!');
    } catch (error) {
      alert('Failed to send test notification. Please check your NTFY settings.');
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
        <h2>NTFY Settings</h2>
        <p>Set your NTFY topic and domain for notifications</p>
        <form onSubmit={handleSubmit} className="modal-form">
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
          <div className="modal-actions">
            <button type="submit" className="submit-button">
              Save
            </button>
            <button type="button" onClick={testNtfyTopic} className="test-button">
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

export default NtfySettingsModal;
