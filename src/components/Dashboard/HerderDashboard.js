import React from 'react';
import GeoTrackerHerder from "../Cowtracking/GeotrackerHerder";
import AIChatBotHerder from "../Cowtracking/AIChatbotHerder";
import ChatBox from "../Cowtracking/ChatBox";
import './AdminDashboard.css'; // Reuse this same CSS file
import AIChatBotTinyLlama from "../Cowtracking/AIChatBotTinyLLaMA";
import herderIcon from '../../assets/herder.png'; // Ensure this path is correct

const HerderDashboard = ({ userId }) => {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Welcome to the Herder Dashboard</h1>
        <p>Share your live location to assist monitoring and avoid restricted zones.</p>
      </div>
      
      
        <div className="admin-main">
       
            <GeoTrackerHerder userId={userId} />
                <div style={{ display: 'flex', gap: '20px' }}>
                          <div style={{ flex: 1 }}>
                            <img src={herderIcon} alt="herder" style={{ width: '50px' }} />
                            <AIChatBotHerder />
                          </div>
                          <div style={{ flex: 1 }}>
                            <img src={herderIcon} alt="AI Bot" style={{ width: '50px' }} />
                            <ChatBox userId={userId} role="herder" />
                          </div>
                        </div>
                
                          <div className="aichatbot-llama-section" style={{ marginTop: '20px', padding: '10px', border: '1px solid #ccc', borderRadius: '10px' }}>
                                <img src={herderIcon} alt="TinyLLaMA" style={{ width: '50px', marginRight: '10px' }} />
                                <h3>Ask AgroAI (TinyLLaMA)</h3>
                                <AIChatBotTinyLlama userId={userId} role="herder" />
                          </div>
      </div>
    </div>
  );
};

export default HerderDashboard;