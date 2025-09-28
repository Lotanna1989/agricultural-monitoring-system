import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, MapPin, DollarSign, Eye, Download, Heart, Share2, Tag, Filter, Search, Grid, List, Wallet, CheckCircle, AlertCircle, Clock, Star, Users, TrendingUp } from 'lucide-react';
import { ethers } from 'ethers';

// Mock smart contract configuration
const CONTRACT_ADDRESS = "0x2B69F24A8274f90ACb8C41e3a708f30248b4992D";
const CONTRACT_ABI = [
  {
    "inputs": [
      {"internalType": "string", "name": "title", "type": "string"},
      {"internalType": "string", "name": "description", "type": "string"},
      {"internalType": "uint256", "name": "price", "type": "uint256"},
      {"internalType": "string", "name": "location", "type": "string"},
      {"internalType": "string", "name": "category", "type": "string"},
      {"internalType": "string", "name": "ipfsHash", "type": "string"}
    ],
    "name": "listPhoto",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"internalType": "uint256", "name": "photoId", "type": "uint256"}
    ],
    "name": "purchasePhoto",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const OutbackPhotoMarketplace = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeView, setActiveView] = useState('marketplace');
  const [viewMode, setViewMode] = useState('grid');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Upload form states
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    category: 'landscape',
    file: null,
    preview: null
  });
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const categories = [
    { id: 'all', name: 'All Photos', icon: '📸', count: '2,847+' },
    { id: 'spiritual', name: 'Sacred Sites', icon: '🏛️', count: '426+' },
    { id: 'wildlife', name: 'Wildlife', icon: '🦘', count: '1,234+' },
    { id: 'landscape', name: 'Landscapes', icon: '🏜️', count: '892+' },
    { id: 'culture', name: 'Aboriginal Culture', icon: '🎨', count: '295+' },
    { id: 'astronomy', name: 'Night Sky', icon: '⭐', count: '178+' }
  ];

  const featuredPhotos = [
    {
      id: 1,
      title: "Uluru at Golden Hour",
      photographer: "Sarah Outback",
      location: "Uluru-Kata Tjuta National Park, NT",
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
      price: "0.05",
      currency: "ETH",
      views: 1247,
      likes: 89,
      category: "landscape",
      description: "Captured during the magical golden hour, this image shows Uluru in all its majestic glory.",
      tags: ["uluru", "sunset", "sacred", "outback"],
      resolution: "4K",
      uploadDate: "2024-03-15",
      verified: true
    },
    {
      id: 2,
      title: "Red Kangaroo Family",
      photographer: "Jack Bushman",
      location: "Alice Springs, NT",
      image: "https://images.unsplash.com/photo-1551214012-84f95e060dee?w=600&h=400&fit=crop",
      price: "0.03",
      currency: "ETH",
      views: 892,
      likes: 67,
      category: "wildlife",
      description: "A mother kangaroo with her joey, photographed in their natural habitat.",
      tags: ["kangaroo", "wildlife", "family", "nature"],
      resolution: "6K",
      uploadDate: "2024-03-12",
      verified: true
    },
    {
      id: 3,
      title: "Ancient Rock Art",
      photographer: "Emma Dreaming",
      location: "Kakadu National Park, NT",
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop",
      price: "0.08",
      currency: "ETH",
      views: 2134,
      likes: 156,
      category: "spiritual",
      description: "40,000-year-old Aboriginal rock art depicting Dreamtime stories.",
      tags: ["aboriginal", "rock-art", "ancient", "culture"],
      resolution: "8K",
      uploadDate: "2024-03-10",
      verified: true
    },
    {
      id: 4,
      title: "Milky Way over Outback",
      photographer: "Steve Stargazer",
      location: "Coober Pedy, SA",
      image: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=600&h=400&fit=crop",
      price: "0.06",
      currency: "ETH",
      views: 1456,
      likes: 98,
      category: "astronomy",
      description: "The Milky Way galaxy captured above the South Australian outback.",
      tags: ["milky-way", "stars", "astronomy", "night"],
      resolution: "12K",
      uploadDate: "2024-03-08",
      verified: true
    },
    {
      id: 5,
      title: "Devils Marbles Formation",
      photographer: "Mike Rockhopper",
      location: "Karlu Karlu, NT",
      image: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=600&h=400&fit=crop",
      price: "0.04",
      currency: "ETH",
      views: 743,
      likes: 52,
      category: "landscape",
      description: "The mysterious granite boulders known as Devils Marbles.",
      tags: ["devils-marbles", "granite", "formation", "geology"],
      resolution: "5K",
      uploadDate: "2024-03-05",
      verified: true
    },
    {
      id: 6,
      title: "Wedge-tailed Eagle",
      photographer: "Lisa Wingspan",
      location: "Flinders Ranges, SA",
      image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=400&fit=crop",
      price: "0.07",
      currency: "ETH",
      views: 1089,
      likes: 78,
      category: "wildlife",
      description: "Australia's largest bird of prey soaring over the Flinders Ranges.",
      tags: ["eagle", "bird", "prey", "flight"],
      resolution: "7K",
      uploadDate: "2024-03-02",
      verified: true
    }
  ];

  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        setAccount(accounts[0]);
        setWalletConnected(true);
        
        const contractInstance = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          signer
        );
        setContract(contractInstance);
        
        alert(`Wallet connected! Account: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
      } else {
        alert('MetaMask not found. Please install MetaMask extension.');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      alert('Failed to connect wallet');
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setUploadData({
        ...uploadData,
        file: file,
        preview: URL.createObjectURL(file)
      });
    } else {
      alert('Please select a valid image file');
    }
  };

  const handleUpload = async () => {
    if (!walletConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!uploadData.title || !uploadData.description || !uploadData.price || !uploadData.file) {
      alert('Please fill in all required fields and select an image');
      return;
    }

    setLoading(true);

    try {
      // In a real implementation, you would upload to IPFS first
      const mockIpfsHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
      
      const priceInWei = ethers.parseEther(uploadData.price);
      
      // Mock contract interaction
      console.log('Uploading photo:', {
        title: uploadData.title,
        description: uploadData.description,
        price: priceInWei.toString(),
        location: uploadData.location,
        category: uploadData.category,
        ipfsHash: mockIpfsHash
      });

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      alert(`Photo uploaded successfully!

Title: ${uploadData.title}
Location: ${uploadData.location}
Price: ${uploadData.price} ETH
Category: ${uploadData.category}

Your photo is now available for purchase in the marketplace!`);

      // Reset form
      setUploadData({
        title: '',
        description: '',
        price: '',
        location: '',
        category: 'landscape',
        file: null,
        preview: null
      });
      setShowUploadModal(false);

    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload photo');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (photo) => {
    if (!walletConnected) {
      alert('Please connect your wallet first');
      return;
    }

    setLoading(true);

    try {
      const priceInWei = ethers.parseEther(photo.price);
      
      // Mock purchase transaction
      console.log('Purchasing photo:', {
        photoId: photo.id,
        price: priceInWei.toString(),
        title: photo.title
      });

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      alert(`Purchase successful!

Photo: ${photo.title}
Photographer: ${photo.photographer}
Price: ${photo.price} ETH
Location: ${photo.location}

High-resolution download will begin shortly.`);

    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Failed to purchase photo');
    } finally {
      setLoading(false);
    }
  };

  const filteredPhotos = featuredPhotos.filter(photo => {
    const matchesCategory = selectedCategory === 'all' || photo.category === selectedCategory;
    const matchesSearch = photo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         photo.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const sortedPhotos = [...filteredPhotos].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return parseFloat(a.price) - parseFloat(b.price);
      case 'price-high':
        return parseFloat(b.price) - parseFloat(a.price);
      case 'popular':
        return b.views - a.views;
      case 'liked':
        return b.likes - a.likes;
      default:
        return new Date(b.uploadDate) - new Date(a.uploadDate);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 overflow-hidden relative">
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-b border-red-200 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 via-orange-400 to-yellow-500 rounded-xl flex items-center justify-center shadow-xl transform hover:rotate-12 transition-transform">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 via-orange-600 to-yellow-600 bg-clip-text text-transparent">
                  Outback Visions
                </h1>
                <p className="text-xs text-gray-500 flex items-center">
                  Australian Outback Photography Marketplace
                </p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => setActiveView('marketplace')}
                className={`transition-colors flex items-center hover:scale-105 transform ${
                  activeView === 'marketplace' ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                }`}
              >
                <Eye className="w-4 h-4 mr-2" />
                Marketplace
              </button>
              <button 
                onClick={() => setActiveView('upload')}
                className={`transition-colors flex items-center hover:scale-105 transform ${
                  activeView === 'upload' ? 'text-red-600' : 'text-gray-600 hover:text-red-600'
                }`}
              >
                <Upload className="w-4 h-4 mr-2" />
                Sell Photos
              </button>
              <a href="#" className="text-gray-600 hover:text-red-600 transition-colors flex items-center hover:scale-105 transform">
                <Users className="w-4 h-4 mr-2" />
                Community
              </a>
            </div>
            
            <div className="flex items-center space-x-4">
              {!walletConnected ? (
                <button 
                  onClick={connectWallet}
                  className="bg-gradient-to-r from-red-500 via-orange-400 to-yellow-500 text-white px-6 py-2 rounded-full hover:shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center space-x-2 font-bold"
                >
                  <Wallet className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </button>
              ) : (
                <div className="text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                  <div className="text-green-600 font-medium flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Connected
                  </div>
                  <div className="text-gray-600">{account?.slice(0, 6)}...{account?.slice(-4)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {activeView === 'marketplace' && (
        <>
          <section className={`pt-32 pb-20 transition-all duration-1000 relative z-20 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <div className="inline-flex items-center bg-gradient-to-r from-red-200 via-orange-200 to-yellow-200 rounded-full px-8 py-3 mb-8 border-3 border-red-300 shadow-2xl animate-pulse">
                  <Camera className="w-6 h-6 mr-3 text-red-700" />
                  <span className="text-red-700 font-bold text-lg">Authentic Australian Outback Photography</span>
                </div>
                
                <h2 className="text-6xl md:text-8xl font-black mb-8 leading-tight">
                  <div className="bg-gradient-to-r from-red-500 via-orange-600 to-yellow-500 bg-clip-text text-transparent flex items-center justify-center gap-4 mb-4">
                    Capture the Spirit
                  </div>
                  <div className="text-gray-800 flex items-center justify-center gap-6">
                    of the Outback
                  </div>
                </h2>
                
                <p className="text-2xl text-gray-600 mb-10 max-w-4xl mx-auto">
                  Discover and purchase authentic photography from Australia's remote outback. 
                  From sacred Aboriginal sites to stunning wildlife captured by local photographers.
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
                  <div className="text-center p-6 bg-white/70 backdrop-blur rounded-2xl border-2 border-red-200 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                    <Camera className="w-8 h-8 mx-auto mb-2 text-red-600" />
                    <div className="text-3xl font-bold text-red-600 mb-1">2,847</div>
                    <div className="text-gray-600">Photos Available</div>
                  </div>
                  <div className="text-center p-6 bg-white/70 backdrop-blur rounded-2xl border-2 border-orange-200 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                    <Users className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <div className="text-3xl font-bold text-orange-600 mb-1">187</div>
                    <div className="text-gray-600">Photographers</div>
                  </div>
                  <div className="text-center p-6 bg-white/70 backdrop-blur rounded-2xl border-2 border-yellow-200 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                    <MapPin className="w-8 h-8 mx-auto mb-2 text-yellow-600" />
                    <div className="text-3xl font-bold text-yellow-600 mb-1">45</div>
                    <div className="text-gray-600">Outback Locations</div>
                  </div>
                  <div className="text-center p-6 bg-white/70 backdrop-blur rounded-2xl border-2 border-green-200 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-3xl font-bold text-green-600 mb-1">127 ETH</div>
                    <div className="text-gray-600">Total Sales</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Categories */}
          <section className="py-10 relative z-20">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-br from-red-100 to-orange-100 border-red-400 shadow-xl'
                        : 'bg-white/70 backdrop-blur border-gray-200 shadow-lg hover:shadow-xl'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{category.icon}</div>
                      <h4 className="font-bold text-sm mb-1 text-gray-800">{category.name}</h4>
                      <p className="text-gray-600 text-xs">{category.count}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Search and Filters */}
              <div className="flex flex-wrap items-center gap-4 mb-8 bg-white/70 backdrop-blur rounded-2xl p-4 border border-gray-200">
                <div className="flex-1 min-w-64">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search photos, locations, or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="newest">Newest First</option>
                  <option value="popular">Most Popular</option>
                  <option value="liked">Most Liked</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>

                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-red-100 text-red-600' : 'text-gray-600'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-red-100 text-red-600' : 'text-gray-600'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Photo Grid */}
          <section className="py-10 bg-white/30 backdrop-blur relative z-20">
            <div className="max-w-7xl mx-auto px-6">
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-6'}>
                {sortedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border border-gray-200 ${
                      viewMode === 'list' ? 'flex' : ''
                    }`}
                  >
                    <div className={`relative ${viewMode === 'list' ? 'w-64 flex-shrink-0' : ''}`}>
                      <img
                        src={photo.image}
                        alt={photo.title}
                        className={`object-cover ${viewMode === 'list' ? 'w-full h-48' : 'w-full h-64'}`}
                      />
                      <div className="absolute top-3 left-3 bg-black/70 text-white px-2 py-1 rounded text-xs font-medium">
                        {photo.resolution}
                      </div>
                      <div className="absolute top-3 right-3">
                        {photo.verified && (
                          <div className="bg-green-600 text-white p-1 rounded-full">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur rounded-full px-2 py-1 flex items-center space-x-1">
                        <DollarSign className="w-3 h-3 text-green-600" />
                        <span className="text-sm font-bold text-green-600">{photo.price} ETH</span>
                      </div>
                    </div>
                    
                    <div className="p-4 flex-1">
                      <div className="flex items-center text-gray-500 text-xs mb-2">
                        <MapPin className="w-3 h-3 mr-1" />
                        {photo.location}
                      </div>
                      
                      <h4 className="text-lg font-bold mb-2 text-gray-800">{photo.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{photo.description}</p>
                      
                      <div className="flex items-center text-xs text-gray-500 mb-3">
                        <span className="mr-4 flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {photo.views}
                        </span>
                        <span className="mr-4 flex items-center">
                          <Heart className="w-3 h-3 mr-1" />
                          {photo.likes}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(photo.uploadDate).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {photo.tags.slice(0, 3).map((tag, idx) => (
                          <span key={idx} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          by {photo.photographer}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedPhoto(photo)}
                            className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handlePurchase(photo)}
                            disabled={loading}
                            className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transition-all flex items-center space-x-1 disabled:opacity-50"
                          >
                            {loading ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <Download className="w-4 h-4" />
                                <span>Buy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Upload Section */}
      {activeView === 'upload' && (
        <section className="pt-32 pb-20 min-h-screen">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                Share Your Outback Photography
              </h2>
              <p className="text-xl text-gray-600">
                Earn cryptocurrency by selling your authentic Australian outback photos
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur rounded-3xl p-8 shadow-2xl border border-gray-200">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Area */}
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Upload Your Photo
                  </h3>
                  
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-red-400 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadData.preview ? (
                      <div className="relative">
                        <img 
                          src={uploadData.preview} 
                          alt="Preview" 
                          className="max-w-full max-h-64 mx-auto rounded-lg shadow-lg"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadData({...uploadData, file: null, preview: null});
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 mb-2">Click to select your photo</p>
                        <p className="text-sm text-gray-500">Supports JPG, PNG (Max 10MB)</p>
                      </>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  
                  <div className="mt-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Photo Title *
                      </label>
                      <input
                        type="text"
                        value={uploadData.title}
                        onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
                        placeholder="e.g., Uluru at Sunset"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description *
                      </label>
                      <textarea
                        value={uploadData.description}
                        onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                        placeholder="Describe your photo, the story behind it, technical details..."
                        rows="4"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Details Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      value={uploadData.location}
                      onChange={(e) => setUploadData({...uploadData, location: e.target.value})}
                      placeholder="e.g., Uluru-Kata Tjuta National Park, NT"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={uploadData.category}
                      onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="landscape">Landscape</option>
                      <option value="wildlife">Wildlife</option>
                      <option value="spiritual">Sacred Sites</option>
                      <option value="culture">Aboriginal Culture</option>
                      <option value="astronomy">Night Sky</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (ETH) *
                    </label>
                    <input
                      type="number"
                      value={uploadData.price}
                      onChange={(e) => setUploadData({...uploadData, price: e.target.value})}
                      placeholder="0.05"
                      step="0.01"
                      min="0.01"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Platform takes 5% commission
                    </p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Important Guidelines
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Ensure you have rights to sell this photograph</li>
                      <li>• Respect Aboriginal sacred sites and cultural sensitivities</li>
                      <li>• Only upload original, unedited photos when possible</li>
                      <li>• Include accurate location and cultural context</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-800 mb-2">
                      What happens after upload?
                    </h4>
                    <ol className="text-sm text-blue-700 space-y-1">
                      <li>1. Photo is stored on IPFS for decentralization</li>
                      <li>2. Smart contract creates your NFT listing</li>
                      <li>3. Photo appears in marketplace immediately</li>
                      <li>4. You earn ETH from each purchase</li>
                    </ol>
                  </div>

                  <button
                    onClick={handleUpload}
                    disabled={loading || !uploadData.title || !uploadData.description || !uploadData.price || !uploadData.file}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-lg font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Uploading to Blockchain...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        <span>Upload & List for Sale</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Recent Uploads by Others */}
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-xl font-bold mb-6">Recent Uploads from the Community</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {featuredPhotos.slice(0, 3).map((photo) => (
                    <div key={photo.id} className="bg-white/50 rounded-xl overflow-hidden border border-gray-200">
                      <img src={photo.image} alt={photo.title} className="w-full h-32 object-cover" />
                      <div className="p-3">
                        <h4 className="font-medium text-sm">{photo.title}</h4>
                        <p className="text-xs text-gray-600">{photo.location}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">by {photo.photographer}</span>
                          <span className="text-sm font-bold text-green-600">{photo.price} ETH</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="relative">
              <img 
                src={selectedPhoto.image} 
                alt={selectedPhoto.title}
                className="w-full h-96 object-cover rounded-t-3xl"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
              >
                ×
              </button>
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur rounded-full px-3 py-1 flex items-center space-x-1">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-bold text-green-600">{selectedPhoto.price} ETH</span>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedPhoto.title}</h2>
                  <div className="flex items-center text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 mr-2" />
                    {selectedPhoto.location}
                  </div>
                  <div className="text-sm text-gray-600">
                    by {selectedPhoto.photographer}
                  </div>
                </div>
                {selectedPhoto.verified && (
                  <div className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm flex items-center">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Verified
                  </div>
                )}
              </div>

              <p className="text-gray-700 mb-6">{selectedPhoto.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Eye className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="font-bold">{selectedPhoto.views}</div>
                  <div className="text-gray-600">Views</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Heart className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="font-bold">{selectedPhoto.likes}</div>
                  <div className="text-gray-600">Likes</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Tag className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="font-bold">{selectedPhoto.resolution}</div>
                  <div className="text-gray-600">Resolution</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <div className="font-bold">{new Date(selectedPhoto.uploadDate).toLocaleDateString()}</div>
                  <div className="text-gray-600">Uploaded</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {selectedPhoto.tags.map((tag, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-600 text-sm px-3 py-1 rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => handlePurchase(selectedPhoto)}
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-lg font-bold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Purchase for {selectedPhoto.price} ETH</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-red-900 text-white py-16 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-2xl font-bold">Outback Visions</h4>
              </div>
              <p className="text-gray-300">Connecting the world with authentic Australian outback photography through blockchain technology.</p>
            </div>
            
            <div>
              <h5 className="font-bold mb-4">For Photographers</h5>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-red-400 transition-colors">Upload Photos</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">Pricing Guide</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">Best Practices</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">Cultural Guidelines</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold mb-4">For Buyers</h5>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-red-400 transition-colors">Browse Gallery</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">License Types</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">Usage Rights</a></li>
                <li><a href="#" className="hover:text-red-400 transition-colors">Download Guide</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold mb-4">Categories</h5>
              <ul className="space-y-2 text-gray-300">
                <li>🏛️ Sacred Aboriginal Sites</li>
                <li>🦘 Australian Wildlife</li>
                <li>🏜️ Desert Landscapes</li>
                <li>⭐ Outback Night Sky</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 flex items-center justify-between">
            <p className="text-gray-400">© 2024 Outback Visions. Celebrating Australia's remote beauty through photography.</p>
            <div className="flex items-center space-x-4">
              <span className="text-gray-400">Powered by Ethereum</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OutbackPhotoMarketplace;