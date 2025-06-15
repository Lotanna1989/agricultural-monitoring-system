// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import LandingPage from './components/Dashboard/LandingPage';
import Signup from './components/Auth/Signup';
import Login from './components/Auth/Login';

import AdminDashboard from './components/Dashboard/AdminDashboard';
import HerderDashboard from './components/Dashboard/HerderDashboard';
import FarmerDashboard from './components/Dashboard/FarmerDashboard';

import withUserId from './components/Cowtracking/PrivateDashboardWrapper';

import IoTLivestockDashboard from './components/IoTDashboard/IoTLivestockDashboard';

const AdminDashboardWithUser = withUserId(AdminDashboard);
const HerderDashboardWithUser = withUserId(HerderDashboard);
const FarmerDashboardWithUser = withUserId(FarmerDashboard);

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/login" element={<Login />} />

    <Route path="/admin-dashboard" element={<AdminDashboardWithUser />} />
    <Route path="/herder-dashboard" element={<HerderDashboardWithUser />} />
    <Route path="/farmer-dashboard" element={<FarmerDashboardWithUser />} />
    <Route path="/iot-dashboard" element={<IoTLivestockDashboard />} />
  </Routes>
);

export default App;
