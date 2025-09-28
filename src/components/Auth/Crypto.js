import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight, Sparkles, TrendingUp, Users, Shield, Zap, ChevronRight, MapPin, DollarSign, QrCode, Wallet, ExternalLink, Eye, History, Scan, CheckCircle } from 'lucide-react';
import { getFirestore, collection, getDocs, query, limit, addDoc } from 'firebase/firestore';
import { HashConnect } from "hashconnect";
import { ethers } from 'ethers';

// Smart Contract Configuration
const CONTRACT_ADDRESS = "0x1A58E86A7274f90ACb8C41e3a708f30248b4992C";
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "investmentType", "type": "string"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "string", "name": "targetId", "type": "string"},
      {"internalType": "string", "name": "tokenSymbol", "type": "string"},
      {"internalType": "uint256", "name": "duration", "type": "uint256"},
      {"internalType": "string", "name": "location", "type": "string"},
      {"internalType": "string", "name": "ipfsHash", "type": "string"}
    ],
    "name": "invest",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const Crypto = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('lands');
  const [coins, setCoins] = useState([]);
  
  // Blockchain states
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [txLoading, setTxLoading] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('HBAR');
  const [connectionMethod, setConnectionMethod] = useState('metamask');
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrScanMode, setQrScanMode] = useState('payment');
  const [scannedData, setScannedData] = useState(null);
  const [recentInvestments, setRecentInvestments] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
    
    // Create floating coins
    const createCoins = () => {
      const coinTypes = ['💰', '🪙', '💎', '⭐', '🌟', '✨'];
      const newCoins = [];
      for (let i = 0; i < 20; i++) {
        newCoins.push({
          id: i,
          emoji: coinTypes[Math.floor(Math.random() * coinTypes.length)],
          left: Math.random() * 100,
          top: Math.random() * 100,
          animationDuration: 4 + Math.random() * 6,
          size: 16 + Math.random() * 24,
          delay: Math.random() * 3
        });
      }
      setCoins(newCoins);
    };
    
    createCoins();
    loadRecentInvestments();
  }, []);

  const investmentTypes = [
    { id: 'lands', name: 'Agricultural Lands', icon: '🌾', count: '1,247+', roi: '12-18%' },
    { id: 'farms', name: 'Sustainable Farms', icon: '🚜', count: '856+', roi: '15-22%' },
    { id: 'trees', name: 'Tree Plantations', icon: '🌳', count: '2,134+', roi: '8-14%' },
    { id: 'livestock', name: 'Livestock', icon: '🐄', count: '492+', roi: '10-16%' },
    { id: 'sustainability', name: 'Green Projects', icon: '♻️', count: '378+', roi: '18-25%' }
  ];

  const featuredInvestments = [
    {
      id: 1,
      title: "Cattle Ranch Investment - OutBack Australia",
      location: "Outback, Australia",
      image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=400&h=300&fit=crop",
      minInvestment: "0.5",
      expectedROI: "18%",
      funded: 63,
      timeLeft: "20 days",
      category: "livestock",
      assetId: "cattle-plateau-001"
    },
    {
      id: 2,
      title: "Cocoa Plantation - Ondo State",
      location: "Ngurra, Australia",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
      minInvestment: "0.3",
      expectedROI: "22%",
      funded: 78,
      timeLeft: "15 days",
      category: "trees",
      assetId: "cocoa-ondo-002"
    },
    {
      id: 3,
      title: "Cassava Processing Farm - OUTBACK AUSTRALIA",
      location: "AUSTRALIA",
      image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&h=300&fit=crop",
      minInvestment: "0.2",
      expectedROI: "16%",
      funded: 45,
      timeLeft: "25 days",
      category: "farms",
      assetId: "cassava-ogun-003"
    },
    {
      id: 4,
      title: "Plantain Grove - Ngurra",
      location: "Victoria, Australia",
      image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&h=300&fit=crop",
      minInvestment: "0.25",
      expectedROI: "14%",
      funded: 67,
      timeLeft: "18 days",
      category: "trees",
      assetId: "plantain-crossriver-004"
    },
    {
      id: 5,
      title: "Coconut Plantation - Outback, Australia",
      location: "Australia",
      image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=300&fit=crop",
      minInvestment: "0.4",
      expectedROI: "19%",
      funded: 52,
      timeLeft: "30 days",
      category: "trees",
      assetId: "coconut-lagos-005"
    },
    {
      id: 6,
      title: "Premium Beef Processing - Australia Outback",
      location: "Australia",
      image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=300&fit=crop",
      minInvestment: "0.3",
      expectedROI: "20%",
      funded: 55,
      timeLeft: "22 days",
      category: "processing",
      assetId: "suya-kano-006"
    }
  ];

  // Blockchain Functions
  const loadRecentInvestments = async () => {
    try {
      const db = getFirestore();
      const investmentsSnapshot = await getDocs(
        query(collection(db, 'contractInvestments'), limit(5))
      );
      const investments = investmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRecentInvestments(investments);
    } catch (error) {
      console.error('Error loading recent investments:', error);
    }
  };

  const getTokenAmount = (amount, tokenSymbol) => {
    switch(tokenSymbol) {
      case 'HBAR':
        return ethers.parseUnits(amount, 8);
      case 'USDC':
        return ethers.parseUnits(amount, 6);
      case 'PEACE':
        return ethers.parseUnits(amount, 8);
      default:
        return ethers.parseUnits(amount, 8);
    }
  };

  const connectWallet = async () => {
    try {
      if (connectionMethod === 'hashpack') {
        try {
          const hashconnect = new HashConnect();
          
          // Initialize HashConnect with proper error handling
          const initData = await hashconnect.init({
            name: "AgriVest Investment Platform",
            description: "Agricultural asset investments on Hedera",
            icon: "https://yourapp.com/icon.png"
          }, "testnet", false);
          
          console.log('HashConnect initialized:', initData);
          
          // Set up event listeners before connecting
          hashconnect.pairingEvent.on((pairingData) => {
            console.log('Pairing event:', pairingData);
            if (pairingData && pairingData.accountIds && pairingData.accountIds.length > 0) {
              const accountId = pairingData.accountIds[0];
              setAccount(accountId);
              setWalletConnected(true);
              alert(`HashPack connected successfully! Account: ${accountId}`);
            }
          });

          hashconnect.connectionStatusChangeEvent.on((connectionStatus) => {
            console.log('Connection status changed:', connectionStatus);
          });
          
          // Attempt to connect
          const connectResult = await hashconnect.connect();
          console.log('Connect result:', connectResult);
          
          // Check if already paired
          if (connectResult && connectResult.pairingData && connectResult.pairingData.length > 0) {
            const pairingData = connectResult.pairingData[0];
            if (pairingData.accountIds && pairingData.accountIds.length > 0) {
              const accountId = pairingData.accountIds[0];
              setAccount(accountId);
              setWalletConnected(true);
              alert(`HashPack connected! Account: ${accountId}`);
            }
          } else {
            // If no existing pairing, the pairing event will handle the connection
            alert('Please approve the pairing request in HashPack wallet');
          }
          
        } catch (hashpackError) {
          console.error('HashPack specific error:', hashpackError);
          alert(`HashPack connection failed: ${hashpackError.message}. Make sure HashPack wallet is installed and unlocked.`);
        }
        
      } else if (connectionMethod === 'metamask') {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          const provider = new ethers.BrowserProvider(window.ethereum);
          const userSigner = await provider.getSigner();
          
          setAccount(accounts[0]);
          setWalletConnected(true);
          
          // Create contract instance with signer for actual blockchain calls
          const contractWithSigner = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            userSigner
          );
          setContract(contractWithSigner);
          alert(`MetaMask connected! Account: ${accounts[0]}`);
        } else {
          alert('MetaMask not found. Please install MetaMask extension.');
        }
      }
    } catch (error) {
      console.error('Connection failed:', error);
      alert(`Failed to connect wallet: ${error.message}`);
    }
  };

  const generatePaymentQR = (asset) => {
    const qrData = {
      type: 'payment',
      contractAddress: CONTRACT_ADDRESS,
      assetId: asset.assetId,
      amount: investAmount || asset.minInvestment,
      token: selectedToken,
      timestamp: Date.now(),
      investor: account,
      location: asset.location,
      expectedROI: asset.expectedROI
    };
    return JSON.stringify(qrData, null, 2);
  };

  const generateTraceabilityQR = (asset) => {
    const traceData = {
      type: 'traceability',
      assetId: asset.assetId,
      origin: asset.location,
      contractAddress: CONTRACT_ADDRESS,
      certifications: ['Organic', 'Fair Trade', 'Blockchain Verified', 'Hedera Secured'],
      blockchainVerified: true,
      lastUpdated: new Date().toISOString(),
      supplyChain: [
        {
          stage: 'Farm Origin', 
          location: asset.location, 
          date: new Date().toISOString(),
          blockchainHash: `0x${Math.random().toString(16).substr(2, 8)}...`
        },
        {
          stage: 'Quality Assessment', 
          location: 'Lagos, Nigeria', 
          date: new Date().toISOString(),
          blockchainHash: `0x${Math.random().toString(16).substr(2, 8)}...`
        },
        {
          stage: 'Distribution Ready', 
          location: 'Abuja, Nigeria', 
          date: new Date().toISOString(),
          blockchainHash: `0x${Math.random().toString(16).substr(2, 8)}...`
        }
      ]
    };
    return JSON.stringify(traceData, null, 2);
  };

  const investInAsset = async (asset) => {
    if (!walletConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!investAmount || parseFloat(investAmount) <= 0) {
      alert('Please enter a valid investment amount');
      return;
    }

    if (parseFloat(investAmount) < parseFloat(asset.minInvestment)) {
      alert(`Minimum investment is ${asset.minInvestment} ${selectedToken}`);
      return;
    }

    if (connectionMethod === 'hashpack') {
      // HashPack flow - record intent and provide instructions for manual transaction
      try {
        setTxLoading(true);
        
        // Generate investment intent for HashPack users
        const investmentIntent = {
          investmentId: asset.assetId,
          investor: account,
          amount: investAmount,
          tokenType: selectedToken,
          timestamp: new Date(),
          status: "pending_hashpack_tx",
          assetType: asset.category,
          location: asset.location,
          expectedROI: asset.expectedROI,
          contractAddress: CONTRACT_ADDRESS
        };

        // Save intent to Firebase
        const db = getFirestore();
        const docRef = await addDoc(collection(db, 'hashpackInvestmentIntents'), investmentIntent);

        alert(`HashPack Investment Intent Created!

💰 Amount: ${investAmount} ${selectedToken}
📦 Asset: ${asset.title}
📄 Intent ID: ${docRef.id}
🔗 Contract: ${CONTRACT_ADDRESS}

To complete your investment:
1. Use HashPack to send ${investAmount} HBAR to: ${CONTRACT_ADDRESS}
2. Include memo: ${asset.assetId}
3. Your investment will be processed automatically

Thank you for investing in the Outback's agriculture!`);

        setSelectedAsset(null);
        setInvestAmount('');
        await loadRecentInvestments();
        
      } catch (error) {
        console.error('HashPack intent creation failed:', error);
        alert(`Failed to create investment intent: ${error.message}`);
      } finally {
        setTxLoading(false);
      }
      return;
    }

    // MetaMask flow - direct smart contract interaction
    if (!contract) {
      alert('Contract not initialized. Please reconnect with MetaMask.');
      return;
    }

    setTxLoading(true);

    try {
      // Parse investment amount based on token
      let amount;
      if (selectedToken === 'HBAR') {
        amount = ethers.parseUnits(investAmount, 8); // HBAR has 8 decimals
      } else if (selectedToken === 'USDC') {
        amount = ethers.parseUnits(investAmount, 6); // USDC has 6 decimals  
      } else {
        amount = ethers.parseUnits(investAmount, 8); // Default 8 decimals
      }

      const duration = ethers.toBigInt(90 * 24 * 60 * 60); // 90 days in seconds
      
      let tx;
      
      if (selectedToken === 'HBAR') {
        // HBAR payment (native) - send value with transaction
        tx = await contract.invest(
          asset.category || 'Agriculture',
          amount,
          asset.assetId,
          selectedToken,
          duration,
          asset.location,
          "", // ipfsHash - can be added later
          { value: amount } // Send HBAR with transaction
        );
      } else {
        // Token payment (USDC, PEACE) - requires token approval first
        tx = await contract.invest(
          asset.category || 'Agriculture',
          amount,
          asset.assetId,
          selectedToken,
          duration,
          asset.location,
          "" // ipfsHash
        );
      }

      console.log('Blockchain transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed on Hedera:', receipt);

      // Save to Firebase for tracking and analytics
      const db = getFirestore();
      await addDoc(collection(db, 'contractInvestments'), {
        investmentId: asset.assetId,
        investor: account,
        amount: investAmount,
        tokenType: selectedToken,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        timestamp: new Date(),
        status: "confirmed",
        assetType: asset.category,
        location: asset.location,
        expectedROI: asset.expectedROI
      });

      alert(`Investment Successful! 

💰 Amount: ${investAmount} ${selectedToken}
📄 Transaction: ${tx.hash}
🏗️ Block: ${receipt.blockNumber}
🌾 Asset: ${asset.title}
📍 Location: ${asset.location}
📈 Expected ROI: ${asset.expectedROI}

Your investment is now secured on the Hedera blockchain!`);
      
      // Reset form and reload data
      setSelectedAsset(null);
      setInvestAmount('');
      await loadRecentInvestments();
      
    } catch (error) {
      console.error('Investment failed:', error);
      
      if (error.code === 'INSUFFICIENT_FUNDS') {
        alert('Insufficient funds for this transaction. Please check your wallet balance.');
      } else if (error.code === 'USER_REJECTED') {
        alert('Transaction cancelled by user.');
      } else if (error.message.includes('execution reverted')) {
        alert('Smart contract execution failed. Please check investment parameters.');
      } else {
        alert(`Investment failed: ${error.message}`);
      }
    } finally {
      setTxLoading(false);
    }
  };

  const handleClick = () => {
    navigate("/tester1");
  };

  const handleInvestClick = (investment) => {
    setSelectedAsset(investment);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-green-50 to-emerald-50 overflow-hidden relative">
      {/* Floating Coins Animation */}
      <div className="fixed inset-0 pointer-events-none z-10">
        {coins.map((coin) => (
          <div
            key={coin.id}
            className="absolute"
            style={{
              left: `${coin.left}%`,
              top: `${coin.top}%`,
              fontSize: `${coin.size}px`,
              animation: `float ${coin.animationDuration}s ease-in-out infinite`,
              animationDelay: `${coin.delay}s`,
              opacity: 0.6,
              filter: 'drop-shadow(0 0 15px rgba(255, 215, 0, 0.4))'
            }}
          >
            <div className="animate-spin" style={{ animationDuration: `${coin.animationDuration * 1.5}s` }}>
              {coin.emoji}
            </div>
          </div>
        ))}
      </div>

      {/* Golden Particle Effects */}
      <div className="fixed inset-0 pointer-events-none z-5">
        <div className="absolute top-20 left-10 w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full animate-pulse opacity-60 shadow-lg shadow-yellow-300"></div>
        <div className="absolute top-40 right-20 w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full animate-bounce opacity-50 shadow-lg shadow-orange-300" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-32 left-20 w-5 h-5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full animate-pulse opacity-40 shadow-lg shadow-yellow-300" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-20 right-10 w-4 h-4 bg-gradient-to-r from-yellow-600 to-orange-500 rounded-full animate-bounce opacity-70 shadow-lg shadow-orange-300"></div>
        <div className="absolute top-60 left-1/3 w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full animate-pulse opacity-50 shadow-lg shadow-yellow-300" style={{animationDelay: '0.5s'}}></div>
        <div className="absolute top-80 right-1/3 w-7 h-7 bg-gradient-to-r from-yellow-500 to-orange-400 rounded-full animate-bounce opacity-60 shadow-lg shadow-orange-300" style={{animationDelay: '1.5s'}}></div>
      </div>

      {/* CSS Keyframes */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-20px) rotate(90deg); }
          50% { transform: translateY(-40px) rotate(180deg); }
          75% { transform: translateY(-20px) rotate(270deg); }
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-yellow-200 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 via-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-xl transform hover:rotate-12 transition-transform">
                <span className="text-2xl animate-pulse">🌾</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-600 via-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Ngurra AgriVest 💰
                </h1>
                <p className="text-xs text-gray-500 flex items-center">
                  <span className="text-yellow-500 mr-1 animate-bounce">⚡</span>
                  Powered by Hedera/Solana/Etherium Hashgraph
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => { setQrScanMode('traceability'); setShowQRScanner(true); }}
                className="text-gray-600 hover:text-yellow-600 transition-colors flex items-center hover:scale-105 transform"
              >
                <span className="mr-2 text-xl">📱</span>Scan Food Origin
              </button>
              <a href="#" className="text-gray-600 hover:text-yellow-600 transition-colors flex items-center hover:scale-105 transform">
                <span className="mr-2 text-xl">🏪</span>Marketplace
              </a>
              <a href="#" className="text-gray-600 hover:text-yellow-600 transition-colors flex items-center hover:scale-105 transform">
                <span className="mr-2 text-xl">📊</span>Portfolio
              </a>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full px-4 py-2 border-2 border-yellow-300 shadow-lg hover:shadow-xl transition-shadow">
                  <span className="text-lg animate-spin" style={{animationDuration: '3s'}}>🪙</span>
                  <span className="text-sm text-yellow-700 font-bold">HBAR: $0.082</span>
                </div>
                <div className="flex items-center space-x-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full px-4 py-2 border-2 border-green-300 shadow-lg hover:shadow-xl transition-shadow">
                  <span className="text-lg animate-bounce">🕊️</span>
                  <span className="text-sm text-green-700 font-bold">PEACE: $1.24</span>
                </div>
                <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full px-4 py-2 border-2 border-blue-300 shadow-lg hover:shadow-xl transition-shadow">
                  <span className="text-lg animate-pulse">💵</span>
                  <span className="text-sm text-blue-700 font-bold">USDC: $1.00</span>
                </div>

                 <div className="flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full px-4 py-2 border-2 border-blue-300 shadow-lg hover:shadow-xl transition-shadow">
                  <span className="text-lg animate-pulse">💵</span>
                  <span className="text-sm text-blue-700 font-bold">SOL: $1.00</span>
                </div>
              </div>

              <select 
                value={connectionMethod}
                onChange={(e) => setConnectionMethod(e.target.value)}
                className="border rounded-lg px-2 py-1 text-sm bg-white"
              >
                <option value="metamask">MetaMask [ETH/SOL/HBAR] (Smart Contracts)</option>
                <option value="hashpack">HashPack (Native HBAR)</option>
              </select>

              {!walletConnected ? (
                <button 
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-yellow-500 via-yellow-400 to-orange-500 text-white px-8 py-3 rounded-full hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center space-x-2 border-2 border-yellow-300 font-bold"
                >
                  <span className="text-xl animate-spin" style={{animationDuration: '2s'}}>💎</span>
                  <span>Connect {connectionMethod === 'metamask' ? 'MetaMask' : 'HashPack'}</span>
                  <span className="text-xl">🚀</span>
                </button>
              ) : (
                <div className="text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                  <div className="text-green-600 font-medium flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Connected via {connectionMethod === 'metamask' ? 'MetaMask' : 'HashPack'}
                  </div>
                  <div className="text-gray-600">{account?.slice(0, 6)}...{account?.slice(-4)}</div>
                  {connectionMethod === 'hashpack' && (
                    <div className="text-xs text-blue-600 mt-1">
                      Switch to MetaMask for smart contract investments
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`pt-32 pb-20 transition-all duration-1000 relative z-20 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-gradient-to-r from-yellow-200 via-green-200 to-emerald-200 rounded-full px-8 py-3 mb-8 border-3 border-yellow-300 shadow-2xl animate-pulse">
              <span className="text-3xl mr-3 animate-bounce">🚀</span>
              <span className="text-green-700 font-bold text-lg">Democratizing Agricultural Investment with Blockchain</span>
              <span className="text-3xl ml-3 animate-spin" style={{animationDuration: '3s'}}>💎</span>
            </div>
            
            <h2 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
              <div className="bg-gradient-to-r from-yellow-500 via-green-600 to-emerald-500 bg-clip-text text-transparent flex items-center justify-center gap-4 mb-4">
                <span className="text-5xl animate-bounce">💰</span>
                Invest in the Outback Australia's
                <span className="text-5xl animate-spin" style={{animationDuration: '4s'}}>🌟</span>
              </div>
              <div className="text-gray-800 flex items-center justify-center gap-6">
                <span className="text-5xl animate-pulse">🇳🇬</span>
                Agricultural Future
                <span className="text-5xl animate-bounce" style={{animationDelay: '0.5s'}}>💎</span>
              </div>
            </h2>
            
            <p className="text-2xl text-gray-600 mb-10 max-w-4xl mx-auto flex items-center justify-center gap-3 flex-wrap">
              <span className="text-3xl animate-spin" style={{animationDuration: '2s'}}>🪙</span>
              From cattle ranching to cocoa plantations. Invest with HBAR,SOL, ETH, USDC, or PEACE tokens.
              Track your investments with QR codes from farm to table.
              <span className="text-3xl animate-pulse">🌟</span>
            </p>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
              <button 
                onClick={connectWallet}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-10 py-4 rounded-full text-xl font-bold hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center space-x-3 border-3 border-yellow-300"
              >
                <span className="text-2xl animate-bounce">🚀</span>
                <span>Start Investing</span>
                <span className="text-2xl animate-spin" style={{animationDuration: '2s'}}>💰</span>
                <ChevronRight className="w-6 h-6" />
              </button>
              
              <button 
                onClick={() => { setQrScanMode('payment'); setShowQRScanner(true); }}
                className="bg-white/80 backdrop-blur text-gray-800 px-10 py-4 rounded-full text-xl font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center space-x-3 border-3 border-gray-200"
              >
                <QrCode className="w-6 h-6" />
                <span>QR Payment</span>
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              <div className="text-center p-6 bg-white/70 backdrop-blur rounded-2xl border-2 border-yellow-200 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-2 animate-bounce">💰</div>
                <div className="text-3xl font-bold text-yellow-600 mb-1">$127M+</div>
                <div className="text-gray-600">Total Invested</div>
              </div>
              <div className="text-center p-6 bg-white/70 backdrop-blur rounded-2xl border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-2 animate-pulse">🌾</div>
                <div className="text-3xl font-bold text-green-600 mb-1">4,107</div>
                <div className="text-gray-600">Active Projects</div>
              </div>
              <div className="text-center p-6 bg-white/70 backdrop-blur rounded-2xl border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-2 animate-spin" style={{animationDuration: '3s'}}>🌍</div>
                <div className="text-3xl font-bold text-blue-600 mb-1">54</div>
                <div className="text-gray-600">Countries</div>
              </div>
              <div className="text-center p-6 bg-white/70 backdrop-blur rounded-2xl border-2 border-purple-200 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-2 animate-bounce" style={{animationDelay: '1s'}}>👥</div>
                <div className="text-3xl font-bold text-purple-600 mb-1">89K+</div>
                <div className="text-gray-600">Investors</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Investment Types */}
      <section className="py-20 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-bold mb-6 flex items-center justify-center gap-4">
              <span className="text-4xl animate-spin" style={{animationDuration: '4s'}}>💎</span>
              <span className="bg-gradient-to-r from-yellow-600 to-green-600 bg-clip-text text-transparent">
                Investment Opportunities
              </span>
              <span className="text-4xl animate-bounce">🪙</span>
            </h3>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Diversify your crypto portfolio with real-world Australia Outback agricultural assets backed by blockchain technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-16">
            {investmentTypes.map((type, index) => (
              <div
                key={type.id}
                className={`p-6 rounded-2xl border-3 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  activeTab === type.id
                    ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-400 shadow-2xl'
                    : 'bg-white/70 backdrop-blur border-gray-200 shadow-lg hover:shadow-xl'
                }`}
                onClick={() => setActiveTab(type.id)}
              >
                <div className="text-center">
                  <div className="text-5xl mb-4 animate-bounce" style={{animationDelay: `${index * 0.2}s`}}>
                    {type.icon}
                  </div>
                  <h4 className="font-bold text-lg mb-2 text-gray-800">{type.name}</h4>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-2xl animate-pulse">💰</span>
                    <span className="text-2xl font-bold text-green-600">{type.roi}</span>
                  </div>
                  <p className="text-gray-600 text-sm">{type.count} projects</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Investments */}
      <section className="py-20 bg-white/50 backdrop-blur relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h3 className="text-4xl font-bold mb-4 flex items-center gap-3">
                <span className="text-3xl animate-spin" style={{animationDuration: '3s'}}>🌟</span>
                <span className="bg-gradient-to-r from-yellow-600 to-green-600 bg-clip-text text-transparent">
                  Featured Nigerian Investments
                </span>
              </h3>
              <p className="text-xl text-gray-600">From cattle ranching to cocoa plantations - blockchain secured</p>
            </div>
            <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 rounded-full hover:shadow-xl transition-all transform hover:scale-105 flex items-center space-x-2 font-bold">
              <span>View All</span>
              <span className="text-xl animate-bounce">🚀</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredInvestments.map((investment, index) => (
              <div
                key={investment.id}
                className="bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 border-2 border-yellow-200"
              >
                <div className="relative">
                  <img
                    src={investment.image}
                    alt={investment.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center space-x-1">
                    <span className="animate-pulse">🔥</span>
                    <span>Hot</span>
                  </div>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur rounded-full px-3 py-1 flex items-center space-x-1">
                    <span className="text-lg animate-bounce">💰</span>
                    <span className="text-green-600 font-bold text-sm">{investment.expectedROI}</span>
                  </div>
                  <div className="absolute bottom-4 right-4">
                    <button
                      onClick={() => {
                        const traceData = generateTraceabilityQR(investment);
                        setScannedData(JSON.parse(traceData));
                      }}
                      className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                      title="Generate Traceability QR"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center text-gray-500 text-sm mb-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    {investment.location}
                  </div>
                  
                  <h4 className="text-xl font-bold mb-4 text-gray-800">{investment.title}</h4>
                  
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <span className="text-lg mr-1">💎</span>
                        Min Investment
                      </span>
                      <span className="font-bold text-green-600 flex items-center">
                        <span className="text-lg mr-1">🪙</span>
                        {investment.minInvestment} HBAR
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Funding Progress</span>
                      <span className="font-bold text-blue-600">{investment.funded}%</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-yellow-400 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${investment.funded}%` }}
                      ></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center">
                        <span className="text-lg mr-1">⏰</span>
                        Time Left
                      </span>
                      <span className="font-bold text-orange-600">{investment.timeLeft}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleInvestClick(investment)}
                      className="flex-1 bg-gradient-to-r from-yellow-500 to-green-500 text-white py-3 rounded-2xl font-bold hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                      <span className="text-xl animate-bounce">💰</span>
                      <span>Invest Now</span>
                      <span className="text-xl animate-pulse">🚀</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAsset(investment);
                        setQrScanMode('payment');
                        setShowQRScanner(true);
                      }}
                      className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 transition-colors"
                      title="QR Payment"
                    >
                      <QrCode className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Investments - Only show if there are any */}
      {recentInvestments.length > 0 && (
        <section className="py-20 relative z-20">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center flex items-center justify-center gap-3">
              <span className="text-3xl animate-pulse">📊</span>
              Recent Blockchain Investments
            </h2>
            <div className="bg-white/70 backdrop-blur rounded-3xl shadow-xl overflow-hidden border-2 border-green-200">
              <div className="divide-y divide-gray-200">
                {recentInvestments.map((investment) => (
                  <div key={investment.id} className="px-6 py-4 flex items-center justify-between hover:bg-white/50">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3 animate-bounce">✅</div>
                      <div>
                        <p className="font-medium text-lg">
                          {investment.amount} {investment.tokenType} invested
                        </p>
                        <p className="text-sm text-gray-600">
                          Asset: {investment.investmentId?.slice(0, 12)}... • {investment.timestamp?.toDate?.()?.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {investment.txHash && (
                        <a
                          href={`https://hashscan.io/testnet/transaction/${investment.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center font-medium"
                        >
                          View on HashScan <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-20 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h3 className="text-5xl font-bold mb-6 flex items-center justify-center gap-4">
              <span className="text-4xl animate-spin" style={{animationDuration: '4s'}}>⚡</span>
              <span className="bg-gradient-to-r from-yellow-600 to-green-600 bg-clip-text text-transparent">
                Why Choose AgriVest?
              </span>
              <span className="text-4xl animate-bounce">🌟</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-white/70 backdrop-blur rounded-3xl border-2 border-yellow-200 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-6xl mb-6 animate-bounce">🔒</div>
              <h4 className="text-2xl font-bold mb-4 text-gray-800">Blockchain Security</h4>
              <p className="text-gray-600">Your investments are secured by Hedera's enterprise-grade distributed ledger technology</p>
            </div>
            
            <div className="text-center p-8 bg-white/70 backdrop-blur rounded-3xl border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-6xl mb-6 animate-pulse">🌍</div>
              <h4 className="text-2xl font-bold mb-4 text-gray-800">Nigerian Focus</h4>
              <p className="text-gray-600">Support sustainable agriculture and empower farming communities across Nigeria</p>
            </div>
            
            <div className="text-center p-8 bg-white/70 backdrop-blur rounded-3xl border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
              <div className="text-6xl mb-6 animate-spin" style={{animationDuration: '3s'}}>📈</div>
              <h4 className="text-2xl font-bold mb-4 text-gray-800">QR Traceability</h4>
              <p className="text-gray-600">Track your food from farm to table with blockchain-verified QR codes</p>
            </div>
          </div>
        </div>
      </section>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl max-w-md w-full mx-4 border-2 border-yellow-300">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <Scan className="w-6 h-6 mr-2" />
                {qrScanMode === 'payment' ? 'QR Payment Scanner' : 'Food Traceability Scanner'}
              </h3>
              
              <div className="text-center py-8">
                <QrCode className="w-24 h-24 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  {qrScanMode === 'payment' 
                    ? 'Position QR code to process payment' 
                    : 'Scan product QR code to view origin'
                  }
                </p>
                
                <div className="bg-gray-100 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    {qrScanMode === 'payment' ? 'Generate QR for mobile payment:' : 'Generate QR for supply chain tracking:'}
                  </p>
                  <button
                    onClick={() => {
                      if (qrScanMode === 'payment' && selectedAsset) {
                        if (!investAmount) {
                          alert('Please enter investment amount first');
                          setShowQRScanner(false);
                          return;
                        }
                        const qrData = generatePaymentQR(selectedAsset);
                        navigator.clipboard.writeText(qrData);
                        setScannedData(JSON.parse(qrData));
                        alert('Payment QR data generated and copied to clipboard!');
                        setShowQRScanner(false);
                      } else {
                        const mockTraceData = {
                          type: 'traceability',
                          assetId: selectedAsset?.assetId || 'demo-asset',
                          origin: selectedAsset?.location || 'Organic Farm, Kaduna State, Nigeria',
                          contractAddress: CONTRACT_ADDRESS,
                          blockchainVerified: true,
                          certifications: ['Organic', 'Fair Trade', 'Halal', 'Blockchain Verified'],
                          lastUpdated: new Date().toISOString(),
                          supplyChain: [
                            {
                              stage: 'Farm Origin', 
                              location: selectedAsset?.location || 'Kaduna, Nigeria', 
                              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                              blockchainHash: `0x${Math.random().toString(16).substr(2, 8)}...`
                            },
                            {
                              stage: 'Quality Check', 
                              location: 'Kano, Nigeria', 
                              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
                              blockchainHash: `0x${Math.random().toString(16).substr(2, 8)}...`
                            },
                            {
                              stage: 'Ready for Distribution', 
                              location: 'Lagos, Nigeria', 
                              date: new Date().toISOString(),
                              blockchainHash: `0x${Math.random().toString(16).substr(2, 8)}...`
                            }
                          ]
                        };
                        setScannedData(mockTraceData);
                        navigator.clipboard.writeText(JSON.stringify(mockTraceData, null, 2));
                        alert('Traceability data generated and copied to clipboard!');
                        setShowQRScanner(false);
                      }
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-bold"
                  >
                    {qrScanMode === 'payment' ? '💰 Generate Payment QR' : '📱 Generate Trace QR'}
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setShowQRScanner(false)}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Investment Modal */}
      {selectedAsset && !showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl max-w-md w-full mx-4 max-h-screen overflow-y-auto border-2 border-yellow-300">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <span className="text-2xl mr-2">💰</span>
                Invest in {selectedAsset.title}
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-2">
                    <Shield className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-800">Blockchain Secured Investment</span>
                  </div>
                  <p className="text-sm text-blue-600">
                    Contract: {CONTRACT_ADDRESS.slice(0, 12)}...{CONTRACT_ADDRESS.slice(-4)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Investment Amount
                  </label>
                  <input
                    type="number"
                    value={investAmount}
                    onChange={(e) => setInvestAmount(e.target.value)}
                    placeholder={`Minimum ${selectedAsset.minInvestment}`}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    step="0.01"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Token
                  </label>
                  <select
                    value={selectedToken}
                    onChange={(e) => setSelectedToken(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="HBAR">HBAR (Native)</option>
                    <option value="USDC">USDC (Stable)</option>
                    <option value="PEACE">PEACE (Community)</option>
                  </select>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center mb-2">
                    <QrCode className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="font-medium text-purple-800">QR Payment Options</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setQrScanMode('payment'); setShowQRScanner(true); }}
                      className="flex-1 bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700"
                    >
                      Scan QR
                    </button>
                    <button
                      onClick={() => {
                        const qrData = generatePaymentQR(selectedAsset);
                        navigator.clipboard.writeText(qrData);
                        alert('Payment QR data copied!');
                      }}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Generate QR
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Investment Details</h4>
                  <p className="text-sm text-gray-600 mb-1">Asset ID: {selectedAsset.assetId}</p>
                  <p className="text-sm text-gray-600 mb-1">Expected ROI: {selectedAsset.expectedROI}</p>
                  <p className="text-sm text-gray-600">Minimum: {selectedAsset.minInvestment} HBAR</p>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedAsset(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
                  disabled={txLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => investInAsset(selectedAsset)}
                  disabled={txLoading || !investAmount}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {txLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : connectionMethod === 'hashpack' ? (
                    <>
                      <span className="text-lg mr-2">💎</span>
                      Create Investment Intent
                    </>
                  ) : (
                    <>
                      <span className="text-lg mr-2">💎</span>
                      Invest {investAmount} {selectedToken}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scanned Data Display */}
      {scannedData && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border-2 border-green-200 p-4 max-w-sm z-40">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-bold text-green-800 flex items-center">
              <span className="text-lg mr-2">📱</span>
              {scannedData.type === 'payment' ? 'Payment Data' : 'Food Origin Traced'}
            </h4>
            <button
              onClick={() => setScannedData(null)}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ×
            </button>
          </div>
          
          {scannedData.type === 'traceability' ? (
            <div className="text-sm space-y-2">
              <p><strong>🌍 Origin:</strong> {scannedData.origin}</p>
              <p><strong>✅ Certifications:</strong> {scannedData.certifications?.join(', ')}</p>
              <p><strong>🔗 Contract:</strong> {scannedData.contractAddress?.slice(0, 12)}...{scannedData.contractAddress?.slice(-4)}</p>
              <p><strong>⏰ Last Updated:</strong> {scannedData.lastUpdated ? new Date(scannedData.lastUpdated).toLocaleString() : 'Recently'}</p>
              {scannedData.supplyChain && (
                <div>
                  <strong>🚚 Blockchain Supply Chain:</strong>
                  <ul className="mt-1 space-y-1">
                    {scannedData.supplyChain.map((stage, idx) => (
                      <li key={idx} className="text-xs bg-gray-100 p-1 rounded">
                        <div>{stage.stage} - {stage.location}</div>
                        <div className="text-gray-500">
                          {new Date(stage.date).toLocaleDateString()} • Hash: {stage.blockchainHash}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {scannedData.blockchainVerified && (
                <div className="flex items-center text-green-600 text-xs mt-2">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  <span>Verified on Hedera Blockchain</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm space-y-1">
              <p><strong>💰 Amount:</strong> {scannedData.amount} {scannedData.token}</p>
              <p><strong>📦 Asset:</strong> {scannedData.assetId}</p>
              <p><strong>🔗 Contract:</strong> {scannedData.contractAddress?.slice(0, 12)}...{scannedData.contractAddress?.slice(-4)}</p>
              <p><strong>📍 Location:</strong> {scannedData.location}</p>
              <p><strong>📈 Expected ROI:</strong> {scannedData.expectedROI}</p>
              <p><strong>👤 Investor:</strong> {scannedData.investor?.slice(0, 8)}...{scannedData.investor?.slice(-4)}</p>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-green-900 text-white py-16 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🌾</span>
                </div>
                <h4 className="text-2xl font-bold">AgriVest 💰</h4>
              </div>
              <p className="text-gray-300">Democratizing agricultural investment through blockchain technology</p>
            </div>
            
            <div>
              <h5 className="font-bold mb-4 flex items-center">
                <span className="text-xl mr-2">🏪</span>
                Platform
              </h5>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Marketplace</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">Portfolio</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors">QR Scanner</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold mb-4 flex items-center">
                <span className="text-xl mr-2">💰</span>
                Tokens
              </h5>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-yellow-400 transition-colors flex items-center"><span className="mr-1">🕊️</span>PEACE Token</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors flex items-center"><span className="mr-1">🪙</span>HBAR</a></li>
                <li><a href="#" className="hover:text-yellow-400 transition-colors flex items-center"><span className="mr-1">💵</span>USDC</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold mb-4 flex items-center">
                <span className="text-xl mr-2">🇳🇬</span>
                Nigerian Assets
              </h5>
              <ul className="space-y-2 text-gray-300">
                <li>🐄 Cattle Ranching</li>
                <li>🍫 Cocoa Plantations</li>
                <li>🥔 Cassava Processing</li>
                <li>📱 QR Traceability</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 flex items-center justify-between">
            <p className="text-gray-400">© 2024 AgriVest. Empowering Australian agriculture through blockchain.</p>
            <div className="flex items-center space-x-4">
              <span className="text-2xl animate-spin" style={{animationDuration: '3s'}}>💎</span>
              <span className="text-gray-400">Powered by Hedera Hashgraph</span>
              <span className="text-2xl animate-bounce">🚀</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Crypto;