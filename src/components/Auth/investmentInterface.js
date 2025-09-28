// Enhanced Investment Component with Smart Contract Integration
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';
import { getFirestore, collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { HashConnect } from "hashconnect";
import { ethers } from 'ethers';
import { MapPin, TreePine, QrCode, Wallet, ExternalLink, Calendar, DollarSign, Activity, Shield, CheckCircle} from 'lucide-react';
import { getDocs, query, limit } from 'firebase/firestore'


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
  },
  {
    "inputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "name": "investments",
    "outputs": [
      {"internalType": "address", "name": "investor", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "string", "name": "investmentType", "type": "string"},
      {"internalType": "string", "name": "targetId", "type": "string"},
      {"internalType": "uint256", "name": "startTime", "type": "uint256"},
      {"internalType": "uint256", "name": "duration", "type": "uint256"},
      {"internalType": "bool", "name": "active", "type": "bool"},
      {"internalType": "uint256", "name": "expectedReturn", "type": "uint256"},
      {"internalType": "string", "name": "token", "type": "string"},
      {"internalType": "string", "name": "location", "type": "string"},
      {"internalType": "string", "name": "ipfsHash", "type": "string"},
      {"internalType": "bool", "name": "autoPayoutEnabled", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

const InvestmentInterface = () => {
  const [firebaseAssets, setFirebaseAssets] = useState({ areas: [], cows: [] });
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [investAmount, setInvestAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState('HBAR');
  const [connectionMethod, setConnectionMethod] = useState('metamask');
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [recentInvestments, setRecentInvestments] = useState([]);

  useEffect(() => {
    loadFirebaseAssets();
    loadRecentInvestments();
  }, []);

  const loadFirebaseAssets = async () => {
    try {
      const db = getFirestore();
      
      // Load areas from Firebase
      const areasSnapshot = await getDocs(query(collection(db, 'areas'), limit(6)));
      const areas = areasSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'area',
        ...doc.data(),
        price: calculateAreaPrice(doc.data()),
        roi: '15-22%'
      }));

      // Load tracked cows from Firebase
      const cowsSnapshot = await getDocs(query(collection(db, 'cowLocations'), limit(6)));
      const cows = cowsSnapshot.docs.map(doc => ({
        id: doc.id,
        type: 'cow',
        ...doc.data(),
        price: calculateCowPrice(doc.data()),
        roi: '12-18%'
      }));

      setFirebaseAssets({ areas, cows });
      setLoading(false);
    } catch (error) {
      console.error('Error loading Firebase assets:', error);
      setLoading(false);
    }
  };

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

  const calculateAreaPrice = (areaData) => {
    if (areaData.coordinates && areaData.coordinates.length > 0) {
      return Math.max(0.1, areaData.coordinates.length * 0.025).toFixed(2);
    }
    return "0.1";
  };

  const calculateCowPrice = (cowData) => {
    return (0.05 + Math.random() * 0.15).toFixed(2);
  };

  const connectWallet = async () => {
    try {
      if (connectionMethod === 'hashpack') {
        const hashconnect = new HashConnect();
        await hashconnect.init({
          name: "AgroRithm Investment Platform",
          description: "Agricultural asset investments on Hedera",
          icon: "https://yourapp.com/icon.png"
        }, "testnet", false);
        
        const state = await hashconnect.connect();
        if (state.pairingData?.length > 0) {
          const accountId = state.pairingData[0].accountIds[0];
          setAccount(accountId);
          setWalletConnected(true);
          alert('HashPack connected! Note: Smart contract calls require MetaMask for this demo.');
        }
      } else if (connectionMethod === 'metamask') {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          const provider = new ethers.BrowserProvider(window.ethereum);
          const userSigner = await provider.getSigner();
          
          setAccount(accounts[0]);
          setSigner(userSigner);
          setWalletConnected(true);
          
          // Create contract instance with signer
          const contractWithSigner = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            userSigner
          );
          setContract(contractWithSigner);
        } else {
          alert('MetaMask not found. Please install MetaMask.');
        }
      }
    } catch (error) {
      console.error('Connection failed:', error);
      alert('Failed to connect wallet: ' + error.message);
    }
  };

  // Generate QR code data for mobile payments
  const generateQRPayment = (asset) => {
    const qrData = {
      contractAddress: CONTRACT_ADDRESS,
      assetId: asset.id,
      assetType: asset.type,
      amount: investAmount,
      token: selectedToken,
      location: asset.type === 'area' 
        ? JSON.stringify(asset.coordinates || [])
        : `${asset.lat},${asset.lon}`,
      timestamp: Date.now()
    };
    
    return JSON.stringify(qrData, null, 2);
  };

  // Investment using your actual deployed contract
  const investInAsset = async (asset) => {
    if (!walletConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!investAmount || parseFloat(investAmount) <= 0) {
      alert('Please enter a valid investment amount');
      return;
    }

    if (connectionMethod === 'hashpack') {
      alert('For smart contract interaction, please use MetaMask. HashPack integration coming soon!');
      return;
    }

    if (!contract) {
      alert('Contract not initialized. Please reconnect with MetaMask.');
      return;
    }

    setTxLoading(true);

    try {
      // Prepare investment data
      const amount = ethers.parseEther(investAmount);
      const duration = ethers.toBigInt(90 * 24 * 60 * 60); // 90 days in seconds
      
      const location = asset.type === 'area' 
        ? JSON.stringify(asset.coordinates || [])
        : `${asset.lat || 0},${asset.lon || 0}`;

      let tx;
      
      if (selectedToken === 'HBAR') {
        // HBAR payment (native)
        tx = await contract.invest(
          asset.type === 'area' ? 'Agricultural Land' : 'Livestock Tracking',
          amount,
          asset.id,
          selectedToken,
          duration,
          location,
          "", // ipfsHash
          { value: amount } // Send HBAR with transaction
        );
      } else {
        // Token payment (USDC, etc.)
        tx = await contract.invest(
          asset.type === 'area' ? 'Agricultural Land' : 'Livestock Tracking',
          amount,
          asset.id,
          selectedToken,
          duration,
          location,
          "" // ipfsHash
        );
      }

      console.log('Transaction sent:', tx.hash);
      
      // Wait for confirmation
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Save to Firebase for tracking
      const db = getFirestore();
      await addDoc(collection(db, 'contractInvestments'), {
        investmentId: asset.id,
        investor: account,
        amount: investAmount,
        tokenType: selectedToken,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        timestamp: new Date(),
        status: "confirmed",
        assetType: asset.type,
        location: location
      });

      alert(`Investment successful! 
      
Transaction Hash: ${tx.hash}
Amount: ${investAmount} ${selectedToken}
Asset: ${asset.type === 'area' ? 'Land Area' : 'Tracked Cow'} ${asset.id}`);
      
      // Reset form
      setSelectedAsset(null);
      setInvestAmount('');
      
      // Reload recent investments
      await loadRecentInvestments();
      
    } catch (error) {
      console.error('Investment failed:', error);
      if (error.code === 'INSUFFICIENT_FUNDS') {
        alert('Insufficient funds for this transaction');
      } else if (error.code === 'USER_REJECTED') {
        alert('Transaction cancelled by user');
      } else {
        alert(`Investment failed: ${error.message}`);
      }
    } finally {
      setTxLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading agricultural assets from blockchain...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ngurra Bunjil Investment Platform</h1>
              <p className="text-gray-600">Blockchain-powered SOL/HBAR/ETH/METAMASK agricultural investments</p>
              <p className="text-sm text-blue-600 mt-1">
                Contract: {CONTRACT_ADDRESS.slice(0, 12)}...{CONTRACT_ADDRESS.slice(-4)}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Contract Deployed</span>
              </div>
              
              <select 
                value={connectionMethod}
                onChange={(e) => setConnectionMethod(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                <option value="metamask">MetaMask [ETH/SOL/HBAR](Smart Contract)</option>
                <option value="hashpack">HashPack (View Only)</option>
              </select>
              
              {!walletConnected ? (
                <button
                  onClick={connectWallet}
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Connect Wallet
                </button>
              ) : (
                <div className="text-sm">
                  <div className="text-green-600 font-medium">Connected</div>
                  <div className="text-gray-600">{account?.slice(0, 8)}...{account?.slice(-4)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Recent Investments */}
        {recentInvestments.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Blockchain Investments</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium">Live Transaction Feed</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {recentInvestments.map((investment) => (
                  <div key={investment.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                      <div>
                        <p className="font-medium">
                          {investment.amount} {investment.tokenType} invested
                        </p>
                        <p className="text-sm text-gray-600">
                          {investment.investor?.slice(0, 8)}...{investment.investor?.slice(-4)} • 
                          {investment.assetType || 'Asset'} {investment.investmentId?.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">
                        {investment.timestamp?.toDate?.()?.toLocaleDateString() || 'Recent'}
                      </p>
                      {investment.txHash && (
                        <a
                          href={`https://hashscan.io/testnet/transaction/${investment.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
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
        )}

        {/* Available Areas */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Geofenced Agricultural Areas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {firebaseAssets.areas.map((area) => (
              <div key={area.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <TreePine className="w-6 h-6 text-green-600 mr-2" />
                      <span className="font-semibold">Area {area.id.slice(0, 8)}</span>
                    </div>
                    <span className="text-green-600 font-bold">{area.roi} ROI</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{area.coordinates?.length || 0} boundary points</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Type: {area.type || 'Agricultural'}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {area.price} HBAR minimum
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedAsset(area)}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Invest via Smart Contract
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tracked Livestock */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Tracked Livestock</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {firebaseAssets.cows.map((cow) => (
              <div key={cow.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">🐄</span>
                      <span className="font-semibold">Cow {cow.cowId || cow.id.slice(0, 8)}</span>
                    </div>
                    <span className="text-blue-600 font-bold">{cow.roi} ROI</span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>Lat: {cow.lat?.toFixed(4)}, Lon: {cow.lon?.toFixed(4)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Owner: {cow.userId?.slice(0, 12)}...
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {cow.price} HBAR minimum
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setSelectedAsset(cow)}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Invest via Smart Contract
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Investment Modal */}
      {selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                Blockchain Investment: {selectedAsset.type === 'area' ? 'Agricultural Area' : 'Tracked Livestock'}
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-2">
                    <Shield className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="font-medium text-blue-800">Smart Contract Secured</span>
                  </div>
                  <p className="text-sm text-blue-600">
                    Investment recorded on Hedera blockchain via deployed smart contract
                  </p>
                  <p className="text-xs text-blue-500 mt-1">
                    Contract: {CONTRACT_ADDRESS}
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
                    placeholder={`Minimum ${selectedAsset.price}`}
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
                    <option value="HBAR">HBAR (Native Payment)</option>
                    <option value="USDC">USDC (Token)</option>
                  </select>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Asset Details</h4>
                  <p className="text-sm text-gray-600 mb-1">
                    Asset ID: {selectedAsset.id}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    Type: {selectedAsset.type === 'area' ? 'Agricultural Land' : 'Livestock Tracking'}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    Expected ROI: {selectedAsset.roi}
                  </p>
                  <p className="text-sm text-gray-600">
                    Minimum Investment: {selectedAsset.price} HBAR
                  </p>
                </div>

                {/* QR Code Option */}
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center mb-2">
                    <QrCode className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="font-medium text-purple-800">Mobile Payment</span>
                  </div>
                  <p className="text-sm text-purple-600 mb-2">
                    For mobile wallet payments, here's the QR data:
                  </p>
                  <div className="bg-white p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
                    {generateQRPayment(selectedAsset)}
                  </div>
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
                  disabled={txLoading || !investAmount || connectionMethod === 'hashpack'}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {txLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : connectionMethod === 'hashpack' ? (
                    'Use MetaMask for Investment'
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Invest On Blockchain
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentInterface;