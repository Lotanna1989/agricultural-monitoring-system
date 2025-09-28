import React from 'react';
import GeoTracker from '../Cowtracking/GeoTracker';
import ChatBox from "../Cowtracking/ChatBox";
import './AdminDashboard.css'; // CSS file for styling
import PeaceTokenTest from "../Cowtracking/PeaceTokenTest";

const AdminDashboard = () => {
  const userId = "admin-1"; // Replace with real auth if available

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h2>Welcome to the Admin Dashboard</h2>
        <p>Draw Grazing and Non-Grazing Areas</p>
      </div>

      <div className="admin-main">
        <GeoTracker userRole="admin" />
        <ChatBox userId={userId} role="admin" />
        <PeaceTokenTest />
      </div>
    </div>
  );
};

export default AdminDashboard;
