// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CalendarGrid from './components/CalendarGrid';
import SubscriptionList from './components/SubscriptionList';
import SubscriptionModal from './components/SubscriptionModal';
import Totals from './components/Totals';
import NtfySettingsModal from './components/NtfySettingsModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import './App.css';

function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isNtfyModalOpen, setIsNtfyModalOpen] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get('/api/subscriptions');
      setSubscriptions(response.data.map(sub => ({ ...sub, included: true })));
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const addOrUpdateSubscription = async (subscription) => {
    try {
      if (subscription.id) {
        await axios.put(`/api/subscriptions/${subscription.id}`, subscription);
      } else {
        await axios.post('/api/subscriptions', subscription);
      }
      fetchSubscriptions();
    } catch (error) {
      console.error('Error adding/updating subscription:', error);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    setSelectedSubscription(null);
    setIsModalOpen(true);
  };

  const handleEdit = (subscription) => {
    setSelectedSubscription(subscription);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this subscription?')) {
      try {
        await axios.delete(`/api/subscriptions/${id}`);
        fetchSubscriptions();
      } catch (error) {
        console.error('Error deleting subscription:', error);
      }
    }
  };

  const handleToggleInclude = (id) => {
    setSubscriptions(subscriptions.map(sub =>
      sub.id === id ? { ...sub, included: !sub.included } : sub
    ));
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>
          Subscription Manager
          <button 
            className="ntfy-settings-button" 
            onClick={() => setIsNtfyModalOpen(true)} 
          >
            <FontAwesomeIcon icon={faBell} />
          </button>
        </h1>
      </div>
      <CalendarGrid
        subscriptions={subscriptions}
        onDateClick={handleDateClick}
        currentDate={new Date()}
      />
      {subscriptions.length > 0 && (
        <SubscriptionList
          subscriptions={subscriptions}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleInclude={handleToggleInclude}
        />
      )}
      <Totals subscriptions={subscriptions.filter(sub => sub.included)} />
      {isModalOpen && (
        <SubscriptionModal
          onClose={() => {
            setIsModalOpen(false);
            setSelectedSubscription(null);
            setSelectedDate(null);
          }}
          onSave={addOrUpdateSubscription}
          selectedSubscription={selectedSubscription}
          selectedDate={selectedDate}
        />
      )}
      <NtfySettingsModal
        isOpen={isNtfyModalOpen}
        onClose={() => setIsNtfyModalOpen(false)}
      />
    </div>
  );
}

export default App;