// src/App.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';

import LandingPage from './components/Dashboard/LandingPage';
import Signup from './components/Auth/Signup';
import Login from './components/Auth/Login';
import Crypto from './components/Auth/Crypto';
import InvestmentInterface from './components/Auth/investmentInterface';
import ArtInvest from './components/Auth/ArtInvest';

import AdminDashboard from './components/Dashboard/AdminDashboard';
import HerderDashboard from './components/Dashboard/HerderDashboard';
import FarmerDashboard from './components/Dashboard/FarmerDashboard';
import FunctionTester from './components/Cowtracking/FunctionTester';
import InvestCow  from './components/Cowtracking/InvestCow';
import withUserId from './components/Cowtracking/PrivateDashboardWrapper';
import AgroRithmGame from  './components/Auth/AgroRithmGame';
import IoTLivestockDashboard from './components/IoTDashboard/IoTLivestockDashboard';

const AdminDashboardWithUser = withUserId(AdminDashboard);
const HerderDashboardWithUser = withUserId(HerderDashboard);
const FarmerDashboardWithUser = withUserId(FarmerDashboard);

const App = () => (
  <Routes>
    <Route path="/" element={<LandingPage />} />
    <Route path="/signup" element={<Signup />} />
    <Route path="/login" element={<Login />} />
    <Route path="/crypto" element={<Crypto />} />
    <Route path="/AgroRithmGame" element={<AgroRithmGame />} />
    
    {/* Investment Interface Routes - Multiple ways to access */}
    <Route path="/investment-interface" element={<InvestmentInterface />} />
    <Route path="/investmentinterface" element={<InvestmentInterface />} />
    <Route path="/investment/:id" element={<InvestmentInterface />} />
    <Route path="/investment-interface/:id" element={<InvestmentInterface />} />
    <Route path="/ArtInvest" element={<ArtInvest />} />

    <Route path="/admin-dashboard" element={<AdminDashboardWithUser />} />
    <Route path="/herder-dashboard" element={<HerderDashboardWithUser />} />
    <Route path="/farmer-dashboard" element={<FarmerDashboardWithUser />} />
    <Route path="/iot-dashboard" element={<IoTLivestockDashboard />} />
    <Route path="/tester" element={<FunctionTester />} />
    <Route path="/tester1" element={<InvestCow />} />
  </Routes>
);

export default App;