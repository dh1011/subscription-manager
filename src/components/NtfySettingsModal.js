import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import './NtfySettingsModal.css';

function NtfySettingsModal({ isOpen, onClose }) {
  const [ntfyTopic, setNtfyTopic] = useState('');

  useEffect(() => {
    fetchNtfyTopic();
  }, []);

  const fetchNtfyTopic = async () => {
    try {
      const response = await axios.get('/api/ntfy-topic');
      setNtfyTopic(response.data.topic);
    } catch (error) {
      console.error('Error fetching NTFY topic:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/ntfy-topic', { topic: ntfyTopic });
      onClose();
    } catch (error) {
      console.error('Error saving NTFY topic:', error);
    }
  };

  const testNtfyTopic = async () => {
    try {
      await axios.post(`https://ntfy.sh/${ntfyTopic}`, 'Test notification from Subscription Manager');
      alert('Test notification sent successfully!');
    } catch (error) {
      alert('Failed to send test notification. Please check your NTFY topic.');
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
        <p>Set your NTFY topic for notifications</p>
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