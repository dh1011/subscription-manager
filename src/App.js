// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CalendarGrid from './components/CalendarGrid';
import SubscriptionList from './components/SubscriptionList';
import SubscriptionModal from './components/SubscriptionModal';
import Totals from './components/Totals';
import NtfySettingsModal from './components/NtfySettingsModal';
import CurrencySettingsModal from './components/CurrencySettingsModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';
import { faMoneyBill } from '@fortawesome/free-solid-svg-icons';
import './App.css';

function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isNtfyModalOpen, setIsNtfyModalOpen] = useState(false);
  const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
  const [currency, setCurrency] = useState('dollar');

  useEffect(() => {
    fetchSubscriptions();
    fetchCurrency();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get('/api/subscriptions');
      setSubscriptions(response.data.map(sub => ({ ...sub, included: true })));
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const fetchCurrency = async () => {
    try {
      const response = await axios.get('/api/user-configuration');
      setCurrency(response.data.currency);
    } catch (error) {
      console.error('Error fetching currency:', error);
      setCurrency('USD');
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
          <button 
            className="currency-settings-button" 
            onClick={() => setIsCurrencyModalOpen(true)} 
          >
            <FontAwesomeIcon icon={faMoneyBill} />
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
          currency={currency}
        />
      )}
      <Totals subscriptions={subscriptions.filter(sub => sub.included)} currency={currency} />
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
      <CurrencySettingsModal
        isOpen={isCurrencyModalOpen}
        onClose={() => setIsCurrencyModalOpen(false)}
        currentCurrency={currency}
        onSave={(newCurrency) => {
          setCurrency(newCurrency);
          setIsCurrencyModalOpen(false);
        }}
      />
    </div>
  );
}

export default App;