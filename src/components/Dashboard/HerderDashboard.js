import React from 'react';
import GeoTrackerHerder from "../Cowtracking/GeotrackerHerder";
import AIChatBotHerder from "../Cowtracking/AIChatbotHerder";
import ChatBox from "../Cowtracking/ChatBox";
import './AdminDashboard.css'; // Reuse this same CSS file

const HerderDashboard = ({ userId }) => {
  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Welcome to the Herder Dashboard</h2>
        <p>Share your live location to assist monitoring and avoid restricted zones.</p>
      </div>

      <div className="admin-main">
        <GeoTrackerHerder userRole="herder" userId={userId} />

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <AIChatBotHerder />
          </div>
          <div style={{ flex: 1 }}>
            <ChatBox userId={userId} role="herder" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HerderDashboard;
