import React from 'react';
import GeoTracker from '../Cowtracking/GeoTracker';
import ChatBox from "../Cowtracking/ChatBox";
import AIChatBotFarmer from "../Cowtracking/AIChatbotFarmer";
import './AdminDashboard.css'; // Reuse this same CSS file

const FarmerDashboard = () => {
  const userId = "farmer-1";

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Welcome to the Farmer Dashboard</h2>
        <p>Draw Grazing and Non-Grazing Areas</p>
      </div>

      <div className="admin-main">
        <GeoTracker userRole="farmer" />

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <AIChatBotFarmer />
          </div>
          <div style={{ flex: 1 }}>
            <ChatBox userId={userId} role="farmer" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;
