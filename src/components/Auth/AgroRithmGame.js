import React, { useState, useEffect, useCallback } from 'react';
import { MapPin, Zap, AlertTriangle, DollarSign, Cloud, TrendingUp, MessageCircle, Users, Coins, Globe } from 'lucide-react';

const AgroRithmGame = () => {
  const [gameState, setGameState] = useState({
    cows: [],
    alerts: [],
    score: 100,
    blockchain_logs: [],
    weather: { temp: 28, humidity: 65, rainfall: 'Light' },
    ndvi: 0.7,
    investments: 0,
    clashes_prevented: 0
  });
  
  const [selectedBot, setSelectedBot] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [showInvestment, setShowInvestment] = useState(false);

  // Grazing zones in Africa (simplified coordinates)
  const grazingZones = [
    { id: 1, name: 'Western District Grasslands', type: 'grazing', x: 15, y: 20, width: 25, height: 15 },
    { id: 2, name: 'Victoria River District (VRD', type: 'grazing', x: 60, y: 35, width: 20, height: 20 },
    { id: 3, name: 'Water trough networks (IoT monitored)', type: 'grazing', x: 40, y: 70, width: 30, height: 15 },
    { id: 4, name: 'Great Artesian Basin recharge areas', type: 'restricted', x: 30, y: 45, width: 25, height: 20 },
    { id: 5, name: 'Kakadu wetlands and Lake Eyre Basin floodplains', type: 'restricted', x: 10, y: 60, width: 20, height: 15 },
    { id: 6, name: 'Sacred waterholes & billabongs (First Nations cultural sites)', type: 'restricted', x: 70, y: 15, width: 15, height: 25 }
  ];

  // Initialize cows with random positions
  useEffect(() => {
    const initialCows = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      owner: i < 4 ? 'Fulani Herder A' : 'Fulani Herder B',
      inRestrictedZone: false
    }));
    
    setGameState(prev => ({ ...prev, cows: initialCows }));
  }, []);

  // Check for zone violations
  const checkZoneViolations = useCallback(() => {
    const updatedCows = gameState.cows.map(cow => {
      const inRestricted = grazingZones.some(zone => 
        zone.type === 'restricted' &&
        cow.x >= zone.x && cow.x <= zone.x + zone.width &&
        cow.y >= zone.y && cow.y <= zone.y + zone.height
      );
      
      if (inRestricted && !cow.inRestrictedZone) {
        // New violation
        const alert = {
          id: Date.now(),
          type: 'zone_violation',
          message: `Cow #${cow.id} (${cow.owner}) entered restricted area!`,
          cowId: cow.id,
          timestamp: new Date().toLocaleTimeString()
        };
        
        setGameState(prev => ({
          ...prev,
          alerts: [...prev.alerts, alert],
          score: prev.score - 10,
          blockchain_logs: [...prev.blockchain_logs, {
            action: 'ZONE_VIOLATION',
            cowId: cow.id,
            location: { x: cow.x, y: cow.y },
            timestamp: Date.now()
          }]
        }));
      }
      
      return { ...cow, inRestrictedZone: inRestricted };
    });
    
    setGameState(prev => ({ ...prev, cows: updatedCows }));
  }, [gameState.cows]);

  useEffect(() => {
    const interval = setInterval(checkZoneViolations, 2000);
    return () => clearInterval(interval);
  }, [checkZoneViolations]);

  // Move cow to safe grazing area
  const moveCowToSafeZone = (cowId) => {
    const safeZone = grazingZones.find(zone => zone.type === 'grazing');
    if (safeZone) {
      setGameState(prev => ({
        ...prev,
        cows: prev.cows.map(cow => 
          cow.id === cowId 
            ? { 
                ...cow, 
                x: safeZone.x + Math.random() * safeZone.width, 
                y: safeZone.y + Math.random() * safeZone.height,
                inRestrictedZone: false
              }
            : cow
        ),
        alerts: prev.alerts.filter(alert => alert.cowId !== cowId),
        score: prev.score + 15,
        clashes_prevented: prev.clashes_prevented + 1,
        blockchain_logs: [...prev.blockchain_logs, {
          action: 'COW_RELOCATED',
          cowId: cowId,
          timestamp: Date.now()
        }]
      }));
    }
  };

  // AI Bot responses
  const getBotResponse = (userMessage, botType) => {
    const responses = {
      'Ngurra AI': {
        weather: "Current conditions show optimal grazing weather. NDVI at 0.7 indicates healthy vegetation. Consider rotating grazing areas to prevent overuse.",
        grazing: "Based on satellite data, the eastern savanna shows 23% better grass quality. Move herds there for improved nutrition and sustainability.",
        conflict: "Early warning: Farmer activity detected 2km south. Suggest alternative route through northern corridor to avoid potential clashes.",
        business: "Market prices for cattle up 12% this month. Consider selling 20% of herd for maximum profit while maintaining breeding stock.",
        default: "I'm Ra AI, your agricultural intelligence assistant. I can help with weather insights, grazing optimization, conflict prevention, and business decisions."
      },
      'Ollama Educator': {
        education: "Sustainable grazing involves rotating cattle every 2-3 weeks to allow grass recovery. This increases land productivity by up to 40%.",
        technology: "GPS tags on cattle help prevent overgrazing and reduce human-wildlife conflicts. Blockchain ensures transparent ownership records.",
        climate: "Climate-smart agriculture includes drought-resistant crops, water conservation, and carbon sequestration through proper grazing management.",
        default: "I'm here to educate you about sustainable farming practices, technology adoption, and climate adaptation strategies."
      }
    };
    
    const botResponses = responses[botType];
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('weather') || lowerMessage.includes('rain')) return botResponses.weather || botResponses.default;
    if (lowerMessage.includes('graze') || lowerMessage.includes('grass')) return botResponses.grazing || botResponses.education;
    if (lowerMessage.includes('conflict') || lowerMessage.includes('clash')) return botResponses.conflict || botResponses.default;
    if (lowerMessage.includes('business') || lowerMessage.includes('money')) return botResponses.business || botResponses.default;
    if (lowerMessage.includes('learn') || lowerMessage.includes('education')) return botResponses.education || botResponses.default;
    if (lowerMessage.includes('technology') || lowerMessage.includes('blockchain')) return botResponses.technology || botResponses.default;
    if (lowerMessage.includes('climate')) return botResponses.climate || botResponses.default;
    
    return botResponses.default;
  };

  const sendMessage = () => {
    if (!userInput.trim() || !selectedBot) return;
    
    const userMsg = { sender: 'user', message: userInput, timestamp: Date.now() };
    const botResponse = getBotResponse(userInput, selectedBot);
    const botMsg = { sender: selectedBot, message: botResponse, timestamp: Date.now() + 1 };
    
    setChatMessages(prev => [...prev, userMsg, botMsg]);
    setUserInput('');
  };

  const addInvestment = (amount, country) => {
    setGameState(prev => ({
      ...prev,
      investments: prev.investments + amount,
      score: prev.score + Math.floor(amount / 100),
      blockchain_logs: [...prev.blockchain_logs, {
        action: 'INVESTMENT_RECEIVED',
        amount: amount,
        country: country,
        timestamp: Date.now()
      }]
    }));
    setShowInvestment(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-700 to-amber-600 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Ngurra</h1>
                <p className="text-green-100">Sustainable Livestock Management</p>
              </div>
            </div>
            <div className="flex space-x-6">
              <div className="text-center">
                <p className="text-green-100 text-sm">Sustainability Score</p>
                <p className="text-2xl font-bold text-white">{gameState.score}</p>
              </div>
              <div className="text-center">
                <p className="text-green-100 text-sm">Investments</p>
                <p className="text-2xl font-bold text-green-300">${gameState.investments.toLocaleString()}</p>
              </div>
              <div className="text-center">
                <p className="text-green-100 text-sm">Clashes Prevented</p>
                <p className="text-2xl font-bold text-blue-300">{gameState.clashes_prevented}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map View */}
          <div className="lg:col-span-2 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center">
              <MapPin className="mr-2" size={20} />
              The Outback Australia Grazing Map
            </h2>
            
            <div className="relative bg-amber-100 rounded-lg h-96 overflow-hidden">
              {/* Render grazing zones */}
              {grazingZones.map(zone => (
                <div
                  key={zone.id}
                  className={`absolute border-2 ${
                    zone.type === 'grazing' 
                      ? 'bg-green-300/50 border-green-500' 
                      : 'bg-red-300/50 border-red-500'
                  }`}
                  style={{
                    left: `${zone.x}%`,
                    top: `${zone.y}%`,
                    width: `${zone.width}%`,
                    height: `${zone.height}%`
                  }}
                >
                  <span className="text-xs p-1 bg-white/80 rounded">
                    {zone.name}
                  </span>
                </div>
              ))}
              
              {/* Render cows */}
              {gameState.cows.map(cow => (
                <div
                  key={cow.id}
                  className={`absolute w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold transform -translate-x-1/2 -translate-y-1/2 ${
                    cow.inRestrictedZone 
                      ? 'bg-red-500 text-white animate-pulse' 
                      : 'bg-yellow-600 text-white'
                  }`}
                  style={{
                    left: `${cow.x}%`,
                    top: `${cow.y}%`
                  }}
                  title={`Cow #${cow.id} - ${cow.owner}`}
                >
                  🐄
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-300 border-2 border-green-500 rounded"></div>
                <span className="text-white">Grazing Areas</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-300 border-2 border-red-500 rounded"></div>
                <span className="text-white">Restricted Zones</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg">🐄</span>
                <span className="text-white">Cattle with GPS Tags</span>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Alerts */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                <AlertTriangle className="mr-2 text-red-400" size={18} />
                Live Alerts
              </h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {gameState.alerts.length === 0 ? (
                  <p className="text-green-200 text-sm">All cattle in safe zones</p>
                ) : (
                  gameState.alerts.map(alert => (
                    <div key={alert.id} className="bg-red-500/20 border border-red-400 rounded p-2">
                      <p className="text-red-100 text-xs">{alert.message}</p>
                      <p className="text-red-200 text-xs">{alert.timestamp}</p>
                      <button
                        onClick={() => moveCowToSafeZone(alert.cowId)}
                        className="mt-1 bg-green-500 text-white px-2 py-1 rounded text-xs hover:bg-green-600"
                      >
                        Move to Safe Zone
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Weather & NDVI */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                <Cloud className="mr-2 text-blue-400" size={18} />
                Environmental Data
              </h3>
              <div className="space-y-2 text-sm text-white">
                <div className="flex justify-between">
                  <span>Temperature:</span>
                  <span>{gameState.weather.temp}°C</span>
                </div>
                <div className="flex justify-between">
                  <span>Humidity:</span>
                  <span>{gameState.weather.humidity}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Rainfall:</span>
                  <span className="text-blue-300">{gameState.weather.rainfall}</span>
                </div>
                <div className="flex justify-between">
                  <span>NDVI:</span>
                  <span className="text-green-300">{gameState.ndvi.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Investment Portal */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
              <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                <Globe className="mr-2 text-purple-400" size={18} />
                Crypto Investment
              </h3>
              <button
                onClick={() => setShowInvestment(!showInvestment)}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
              >
                <Coins className="inline mr-2" size={16} />
                Accept Foreign Investment
              </button>
              
              {showInvestment && (
                <div className="mt-3 space-y-2">
                  <button
                    onClick={() => addInvestment(5000, 'Netherlands')}
                    className="w-full bg-orange-500 text-white px-3 py-2 rounded text-sm hover:bg-orange-600"
                  >
                    🇳🇱 Netherlands - $5,000
                  </button>
                  <button
                    onClick={() => addInvestment(7500, 'Germany')}
                    className="w-full bg-yellow-500 text-white px-3 py-2 rounded text-sm hover:bg-yellow-600"
                  >
                    🇩🇪 Germany - $7,500
                  </button>
                  <button
                    onClick={() => addInvestment(10000, 'Canada')}
                    className="w-full bg-red-500 text-white px-3 py-2 rounded text-sm hover:bg-red-600"
                  >
                    🇨🇦 Canada - $10,000
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Assistants */}
        <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center">
            <MessageCircle className="mr-2" size={20} />
            AI Assistance
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bot Selection */}
            <div>
              <div className="flex space-x-4 mb-4">
                <button
                  onClick={() => setSelectedBot('Ra AI')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedBot === 'Ra AI' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <span className="inline mr-2 text-lg">☀️</span>
                  Ngurra AI
                </button>
                <button
                  onClick={() => setSelectedBot('Ollama Educator')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedBot === 'Ollama Educator' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <Users className="inline mr-2" size={16} />
                  Ollama Educator
                </button>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3 mb-4 h-40 overflow-y-auto">
                {chatMessages.length === 0 ? (
                  <p className="text-gray-300 text-sm">
                    Select an AI assistant and ask questions about sustainable farming, weather, grazing, or business insights.
                  </p>
                ) : (
                  chatMessages.map((msg, idx) => (
                    <div key={idx} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      <div className={`inline-block p-2 rounded-lg text-sm max-w-xs ${
                        msg.sender === 'user' 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-white/20 text-white'
                      }`}>
                        <p className="font-semibold text-xs opacity-75 mb-1">
                          {msg.sender === 'user' ? 'You' : msg.sender === 'Ra AI' ? '☀️ Ra AI' : msg.sender}
                        </p>
                        <p>{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Ask about grazing, weather, business..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-300"
                  disabled={!selectedBot}
                />
                <button
                  onClick={sendMessage}
                  disabled={!selectedBot || !userInput.trim()}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>

            {/* Blockchain Logs */}
            <div>
              <h3 className="text-lg font-bold text-white mb-3 flex items-center">
                <TrendingUp className="mr-2 text-green-400" size={18} />
                Hedera Blockchain Logs
              </h3>
              <div className="bg-black/20 rounded-lg p-3 h-64 overflow-y-auto font-mono text-xs">
                {gameState.blockchain_logs.length === 0 ? (
                  <p className="text-gray-400">No blockchain activity yet...</p>
                ) : (
                  gameState.blockchain_logs.slice(-10).map((log, idx) => (
                    <div key={idx} className="mb-2 text-green-300">
                      <span className="text-blue-300">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <br />
                      <span className="text-yellow-300">{log.action}</span>
                      {log.cowId && <span className="text-white"> - Cow #{log.cowId}</span>}
                      {log.amount && <span className="text-green-400"> - ${log.amount}</span>}
                      {log.country && <span className="text-purple-300"> from {log.country}</span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgroRithmGame;