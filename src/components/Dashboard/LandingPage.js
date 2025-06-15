// src/components/Dashboard/LandingPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import landingImg from '../../assets/logo.jpeg';
import logo from '../../assets/logo_white.png';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  const [animate, setAnimate] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Trigger animation after mount
    setTimeout(() => setAnimate(true), 300);
    
    // Mouse tracking for interactive background
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
  {
    "icon": "🐄",
    "title": "Smart Tracking",
    "description": "Real-time livestock monitoring with GPS precision"
  },
  {
    "icon": "🛡️",
    "title": "Blockchain Security",
    "description": "Immutable records on secure blockchain technology"
  },
  {
    "icon": "📊",
    "title": "Analytics Dashboard",
    "description": "Comprehensive insights and reporting tools"
  },
  {
    "icon": "🌍",
    "title": "Geo-Fencing",
    "description": "Smart boundaries and automated alerts"
  },
  {
    "icon": "📡",
    "title": "Real-time IoT Tracking",
    "description": "Live tracking of livestock using IoT devices for accurate location and health data."
  },
  {
    "icon": "🛒",
    "title": "Secure Marketplace",
    "description": "A dedicated platform for buying and selling livestock with integrated features."
  },
  {
    "icon": "🔒",
    "title": "Escrow Protection",
    "description": "Secure escrow services to protect both buyers and sellers in marketplace transactions."
  },
  {
    "icon": "💰",
    "title": "Blockchain Payments",
    "description": "Transparent and secure transactions powered by blockchain for all marketplace purchases."
  },
  {
    "icon": "👁️",
    "title": "AI Visual Cow Tracking",
    "description": "Advanced tracking and identification of individual cows using AI-powered visual recognition."
  }
  ];

  return (
    <div className="landing-container">
      {/* Animated background gradient */}
      <div 
        className="background-gradient"
        style={{
          // Updated radial gradient colors to match brand color (#2e8b57) and its shades
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(46, 139, 87, 0.15) 0%,   /* #2e8b57 with 15% opacity */
            rgba(60, 179, 113, 0.1) 25%,   /* A slightly brighter green with 10% opacity */
            rgba(102, 205, 170, 0.05) 50%, /* A lighter, more desaturated green with 5% opacity */
            transparent 70%)`
        }}
      />
      
      {/* Floating particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Navigation Header */}
      <nav className="nav-header">
        <div className="nav-brand">
           <img
                src={logo}
                alt="AgroRithm Platform"
                className="nav-logo"
              />
        </div>
        <div className="nav-buttons">
          <button 
            className="nav-button secondary" 
            onClick={() => navigate('/login')}
          >
            Login
          </button>
          <button 
            className="nav-button primary" 
            onClick={() => navigate('/signup')}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="hero-section">
        <div className="hero-content">
          <div className={`hero-text ${animate ? 'animate-slide-up' : ''}`}>
            <h1 className="hero-title">
              The Future of
              <span className="gradient-text"> Livestock Management</span>
            </h1>
            <p className="hero-subtitle">
              Empower your farm with cutting-edge solutions for real-time livestock tracking, AI-powered visual monitoring, and a secure blockchain marketplace. Our platform offers unparalleled insights, security, and efficiency for modern farming.
            </p>
            
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Animals Tracked</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">500+</span>
                <span className="stat-label">Happy Farmers</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">99.9%</span>
                <span className="stat-label">Uptime</span>
              </div>
            </div>

            <div className="hero-actions">
              <button 
                className="cta-button primary" 
                onClick={() => navigate('/signup')}
              >
                Start Free Trial
                <span className="button-arrow">→</span>
              </button>
              <button className="cta-button secondary">
                Watch Demo
                <span className="play-icon">▶</span>
              </button>
            </div>
          </div>

          <div className={`hero-image ${animate ? 'animate-float' : ''}`}>
            <div className="image-container">
              <img
                src={landingImg}
                alt="AgroRithm Platform"
                className="main-image"
              />
              <div className="image-glow" />
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title" id='textf'>Why Choose AgroRithm?</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`feature-card ${animate ? 'animate-fade-in' : ''}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Ready to Transform Your Farm?</h2>
          <p className="cta-subtitle">
            Join thousands of farmers already using AgroRithm to revolutionize their livestock management.
          </p>
          <button 
            className="cta-button large primary" 
            onClick={() => navigate('/signup')}
          >
            Get Started Today
            <span className="button-sparkle">✨</span>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
             <img
                src={logo}
                alt="AgroRithm Platform"
                className="nav-logo"
              />
          </div>
          <div className="footer-links">
            <a href="#privacy">Privacy</a>
            <a href="#terms">Terms</a>
            <a href="#support">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;