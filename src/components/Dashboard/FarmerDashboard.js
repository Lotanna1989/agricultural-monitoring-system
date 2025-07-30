import React from 'react';
import GeoTracker from '../Cowtracking/GeoTracker';
import ChatBox from "../Cowtracking/ChatBox";
import AIChatBotFarmer from "../Cowtracking/AIChatbotFarmer";
import './AdminDashboard.css'; // Reuse this same CSS file
import AIChatBotTinyLlama from "../Cowtracking/AIChatBotTinyLLaMA";
import farmerIcon from '../../assets/farmer.png'; // Ensure this path is correct

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
            <img src={farmerIcon} alt="Farmer" style={{ width: '50px' }} />
            <AIChatBotFarmer />
          </div>
          <div style={{ flex: 1 }}>
            <img src={farmerIcon} alt="AI Bot" style={{ width: '50px' }} />
            <ChatBox userId={userId} role="farmer" />
          </div>
        </div>

          <div className="aichatbot-llama-section" style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '10px' }}>
                <img src={farmerIcon} alt="TinyLLaMA" style={{ width: '50px', marginRight: '10px' }} />
                <h3>Ask AgroAI (TinyLLaMA)</h3>
                <AIChatBotTinyLlama userId={userId} role="farmer" />
          </div>

      </div>
    </div>
  );
};

export default FarmerDashboard;