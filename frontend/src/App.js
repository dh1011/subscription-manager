// src/App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CalendarGrid from './components/CalendarGrid';
import SubscriptionList from './components/SubscriptionList';
import SubscriptionModal from './components/SubscriptionModal';
import Totals from './components/Totals';
import ConfigurationModal from './components/ConfigurationModal.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '@iconify-icon/react';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_API_URL;

function App() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [ntfyTopic, setNtfyTopic] = useState('');
  const [ntfyDomain, setNtfyDomain] = useState('https://ntfy.sh');
  const [showCurrencySymbol, setShowCurrencySymbol] = useState(true);
  
  useEffect(() => {
    fetchSubscriptions();
    fetchConfiguration();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/subscriptions`);
      setSubscriptions(response.data.map(sub => ({ ...sub, included: true })));
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    }
  };

  const fetchConfiguration = async () => {
    try {
      const [currencyResponse, ntfyResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/user-configuration`),
        axios.get(`${API_BASE_URL}/api/ntfy-settings`)
      ]);
      setCurrency(currencyResponse.data.currency);
      setShowCurrencySymbol(currencyResponse.data.showCurrencySymbol);
      setNtfyTopic(ntfyResponse.data.topic);
      setNtfyDomain(ntfyResponse.data.domain);
    } catch (error) {
      console.error('Error fetching configuration:', error);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/subscriptions/export`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "subscriptions_export.json");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error exporting subscriptions:", error);
      alert("Failed to export subscriptions. Please try again.");
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API_BASE_URL}/api/subscriptions/import`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Subscriptions imported successfully.");
      fetchSubscriptions(); // Refresh the list after import
    } catch (error) {
      console.error("Error importing subscriptions:", error);
      alert("Failed to import subscriptions. Please check the file format.");
    }
  };

  const addOrUpdateSubscription = async (subscription) => {
    try {
      if (subscription.id) {
        await axios.put(`${API_BASE_URL}/api/subscriptions/${subscription.id}`, subscription);
      } else {
        await axios.post(`${API_BASE_URL}/api/subscriptions`, subscription);
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
        await axios.delete(`${API_BASE_URL}/api/subscriptions/${id}`);
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

  const handleConfigurationSave = async (newConfig) => {
    try {
      await Promise.all([
        axios.post(`${API_BASE_URL}/api/user-configuration`, { 
          currency: newConfig.currency, 
          showCurrencySymbol: newConfig.showCurrencySymbol 
        }),
        axios.post(`${API_BASE_URL}/api/ntfy-settings`, { 
          topic: newConfig.ntfyTopic, 
          domain: newConfig.ntfyDomain 
        })
      ]);
      
      // Update all the states
      setCurrency(newConfig.currency);
      setShowCurrencySymbol(newConfig.showCurrencySymbol);
      setNtfyTopic(newConfig.ntfyTopic);
      setNtfyDomain(newConfig.ntfyDomain);
      setIsConfigModalOpen(false);
      
      // Fetch subscriptions again to update with new currency
      fetchSubscriptions();
    } catch (error) {
      console.error('Error saving configuration:', error);
    }
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>Subscription Manager</h1>
        <div className="header-actions">
          {/* Export Button */}
          <button className="export-button" onClick={handleExport} data-label="Export">
            <Icon icon="mdi:download" className="export-icon" />
          </button>

          {/* Import Button */}
          <label className="import-button" data-label="Import">
            <Icon icon="mdi:upload" className="import-icon" />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="import-input"
            />
          </label>
          {/* Configuration Button */}
          <button 
            className="config-button" 
            onClick={() => setIsConfigModalOpen(true)}
          >
            <FontAwesomeIcon icon={faCog} />
          </button>
        </div>
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
          showCurrencySymbol={showCurrencySymbol}
        />
      )}
      <Totals 
        subscriptions={subscriptions.filter(sub => sub.included)} 
        currency={currency}
        showCurrencySymbol={showCurrencySymbol}
      />
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
          defaultCurrency={currency}
          showCurrencySymbol={showCurrencySymbol}
        />
      )}
      <ConfigurationModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        currency={currency}
        showCurrencySymbol={showCurrencySymbol}
        ntfyTopic={ntfyTopic}
        ntfyDomain={ntfyDomain}
        onSave={handleConfigurationSave}
      />
    </div>
  );
}

export default App;
