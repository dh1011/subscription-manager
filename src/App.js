// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CalendarGrid from './components/CalendarGrid';
import SubscriptionList from './components/SubscriptionList';
import SubscriptionModal from './components/SubscriptionModal';
import Totals from './components/Totals';
import './App.css';

function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get('/api/subscriptions');
      setSubscriptions(response.data);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const addOrUpdateSubscription = async (subscription) => {
    try {
      if (subscription.id) {
        // Update existing subscription
        await axios.put(`/api/subscriptions/${subscription.id}`, subscription);
      } else {
        // Add new subscription
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

  return (
    <div className="app">
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
        />
      )}
      <Totals subscriptions={subscriptions} />
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
    </div>
  );
}

export default App;
