import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ArrowRight, Sparkles, TrendingUp, Users, Shield, BarChart3, Globe, Satellite, MapPin, Eye, Zap, Sun, CloudRain, Thermometer, Wind } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [animate, setAnimate] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

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
    
    // Testimonial rotation
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial(prev => (prev + 1) % 3);
    }, 4000);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(testimonialInterval);
    };
  }, []);

  const features = [
    {
      "icon": <Eye className="w-8 h-8" />,
      "title": "Bunjil AI Guardian",
      "description": "Aboriginal eagle spirit AI watching over your land with ancient wisdom and modern technology",
      "color": "from-amber-500 to-orange-500"
    },
    {
      "icon": <Satellite className="w-8 h-8" />,
      "title": "Satellite Intelligence",
      "description": "Real-time NDVI and NDWI monitoring for crop health and water management",
      "color": "from-blue-500 to-cyan-500"
    },
    {
      "icon": <MapPin className="w-8 h-8" />,
      "title": "Wildlife Discovery",
      "description": "Explore the Outback and discover native animals with GPS-based NFT minting",
      "color": "from-green-500 to-emerald-500"
    },
    {
      "icon": <Shield className="w-8 h-8" />,
      "title": "Hedera Blockchain",
      "description": "Carbon-negative blockchain for secure, sustainable digital asset management",
      "color": "from-purple-500 to-pink-500"
    },
    {
      "icon": <CloudRain className="w-8 h-8" />,
      "title": "Weather Warnings",
      "description": "Early storm, drought, and fire alerts to protect livestock and crops",
      "color": "from-indigo-500 to-blue-500"
    },
    {
      "icon": <TrendingUp className="w-8 h-8" />,
      "title": "Smart Farming",
      "description": "AI-powered recommendations for sustainable land management practices",
      "color": "from-teal-500 to-green-500"
    },
    {
      "icon": <Globe className="w-8 h-8" />,
      "title": "Digital Country",
      "description": "Virtual representation of real Australian Outback locations and landmarks",
      "color": "from-red-500 to-orange-500"
    },
    {
      "icon": <Thermometer className="w-8 h-8" />,
      "title": "Climate Monitoring",
      "description": "Comprehensive environmental data analysis for informed decision making",
      "color": "from-yellow-500 to-red-500"
    },
    {
      "icon": <Wind className="w-8 h-8" />,
      "title": "Precision Agriculture",
      "description": "Optimize irrigation, grazing, and planting with AI-driven insights",
      "color": "from-violet-500 to-purple-500"
    }
  ];

  const testimonials = [
    { name: "Jack Thompson", role: "Cattle Station Owner", text: "Bunjil AI saved my herd during the last bushfire season!" },
    { name: "Sarah Mitchell", role: "Outback Farmer", text: "The weather predictions are good for our remote location." },
    { name: "David Wilson", role: "Conservation Manager", text: "This technology helps us protect both wildlife and agricultural interests." }
  ];

  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-red-900 to-amber-900 text-white overflow-hidden">
      {/* Animated Background - Outback themed */}
      <div 
        className="fixed inset-0 opacity-30 transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(255, 140, 0, 0.4) 0%,
            rgba(255, 69, 0, 0.3) 25%,
            rgba(218, 165, 32, 0.2) 50%,
            transparent 70%)`
        }}
      />
      
      {/* Floating Particles - Desert dust effect */}
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div 
            key={i} 
            className="absolute w-1 h-1 bg-amber-300 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          />
        ))}
      </div>

      {/* Navigation Header */}
      <nav className="relative z-50 flex items-center justify-between p-6 backdrop-blur-md bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🦅</span>
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
            Ngurra
          </span>
        </div>
        
        <div className="hidden md:flex items-center space-x-4">
          <button 
            className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
            onClick={() => navigateTo('/login')}
          >
            Login
          </button>
          <button 
            className="px-6 py-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-amber-500/25"
            onClick={() => navigateTo('/Signup')}
          >
            Sign Up
          </button>
          <button 
            className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-green-500/25 text-sm"
            onClick={() => navigateTo('/Crypto')}
          >
            Wildlife NFTs
          </button>

           <button 
            className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-green-500/25 text-sm"
            onClick={() => navigateTo('/AgroRithmGame')}
          >
            Ngurra Game
          </button>

            <button 
            className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-green-500/25 text-sm"
            onClick={() => navigateTo('/ArtInvest')}
          >
            Art Invest
          </button>

          <button 
            className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 text-sm"
            onClick={() => navigateTo('/bunjil-ai')}
          >
            Bunjil AI
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 container mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className={`space-y-8 ${animate ? 'animate-fade-in' : 'opacity-0'}`}>
            <div className="space-y-6">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                AI Guardian of
                <span className="block bg-gradient-to-r from-amber-400 via-orange-500 to-red-400 bg-clip-text text-transparent animate-pulse">
                  Digital Country
                </span>
              </h1>
              
              <p className="text-xl text-orange-100 leading-relaxed max-w-2xl">
                Explore the Australian Outback through cutting-edge AI technology. Bunjil, the eagle spirit guardian, 
                combines ancient Aboriginal wisdom with modern satellite intelligence to protect your land, 
                livestock, and wildlife.
              </p>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8">
              {[
                { number: "50K+", label: "Wildlife Discovered" },
                { number: "1000+", label: "Farmers Protected" },
                { number: "24/7", label: "AI Monitoring" }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    {stat.number}
                  </div>
                  <div className="text-orange-200 text-sm mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                className="group px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full font-semibold hover:from-amber-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-amber-500/25 hover:scale-105 flex items-center justify-center"
                onClick={() => navigateTo('/outback')}
              >
                Enter Digital Country
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
              </button>
              
              <button className="group px-8 py-4 bg-white/10 backdrop-blur-sm rounded-full font-semibold hover:bg-white/20 transition-all duration-300 border border-white/20 flex items-center justify-center">
                Watch Bunjil Demo
                <Play className="ml-2 group-hover:scale-110 transition-transform" size={20} />
              </button>
            </div>
          </div>

          {/* Hero Visual */}
          <div className={`relative ${animate ? 'animate-bounce' : ''}`}>
            <div className="relative">
              <div className="w-full h-96 bg-gradient-to-br from-amber-400/20 to-orange-600/20 rounded-3xl backdrop-blur-sm border border-white/10 flex items-center justify-center">
                <div className="text-8xl animate-pulse">🦅</div>
              </div>
              
              {/* Floating cards around image */}
              <div className="absolute -top-4 -left-4 bg-gradient-to-br from-blue-500 to-cyan-500 p-3 rounded-xl shadow-lg animate-float">
                <Satellite className="text-white" size={24} />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg animate-float" style={{animationDelay: '1s'}}>
                <MapPin className="text-white" size={24} />
              </div>
              <div className="absolute top-1/2 -right-8 bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg animate-float" style={{animationDelay: '2s'}}>
                <Shield className="text-white" size={24} />
              </div>
              <div className="absolute top-1/4 -left-8 bg-gradient-to-br from-red-500 to-orange-500 p-3 rounded-xl shadow-lg animate-float" style={{animationDelay: '1.5s'}}>
                <span className="text-white text-2xl">🦘</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ancient Wisdom Meets <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Modern Technology</span>
            </h2>
            <p className="text-xl text-orange-100 max-w-3xl mx-auto">
              Bunjil AI combines thousands of years of Aboriginal connection to country with 
              cutting-edge satellite intelligence and blockchain technology
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-2xl ${animate ? 'animate-fade-in' : 'opacity-0'}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-amber-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-orange-200 leading-relaxed group-hover:text-orange-100 transition-colors">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bunjil AI Capabilities Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Meet <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Bunjil</span>
            </h2>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              Your AI guardian watching over the Outback with the wisdom of the eagle spirit
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Sun className="w-6 h-6" />,
                title: "Fire Risk Analysis",
                description: "Real-time bushfire danger assessment and evacuation planning"
              },
              {
                icon: <CloudRain className="w-6 h-6" />,
                title: "Weather Forecasting", 
                description: "Accurate predictions for remote Outback locations"
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Crop Monitoring",
                description: "NDVI satellite analysis for vegetation health tracking"
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Livestock Safety",
                description: "Behavioral analysis and grazing optimization advice"
              }
            ].map((capability, index) => (
              <div 
                key={index}
                className="group p-6 bg-gradient-to-br from-amber-500/10 to-orange-600/10 backdrop-blur-sm rounded-2xl border border-amber-500/20 hover:bg-amber-500/20 transition-all duration-300 hover:scale-105 text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <div className="text-white">
                    {capability.icon}
                  </div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-amber-300">
                  {capability.title}
                </h3>
                <p className="text-orange-200 text-sm">
                  {capability.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Stories from the Outback</h2>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <div className="text-lg italic mb-4">
                "{testimonials[currentTestimonial].text}"
              </div>
              <div className="font-semibold text-amber-400">
                {testimonials[currentTestimonial].name}
              </div>
              <div className="text-orange-200 text-sm">
                {testimonials[currentTestimonial].role}
              </div>
            </div>
            
            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <div 
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentTestimonial ? 'bg-amber-400 w-8' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="container mx-auto text-center">
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-600/10 rounded-3xl p-12 border border-amber-500/20 backdrop-blur-sm">
            <h2 className="text-4xl font-bold mb-6">
              Ready to Explore Digital Country?
            </h2>
            <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
              Join the future of Outback exploration with AI-powered wildlife discovery, 
              sustainable farming insights, and blockchain-secured digital assets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                className="group px-12 py-4 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full font-bold text-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-amber-500/25 hover:scale-105 flex items-center justify-center"
                onClick={() => navigateTo('/outback')}
              >
                Start Exploring
                <Sparkles className="ml-3 group-hover:rotate-12 transition-transform" size={24} />
              </button>
              
              <button 
                className="group px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-green-500/25 hover:scale-105 flex items-center justify-center"
                onClick={() => navigateTo('/wildlife-nfts')}
              >
                Discover Wildlife
                <Eye className="ml-3 group-hover:scale-110 transition-transform" size={24} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">🦅</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Ngurra - Digital Country
              </span>
            </div>
            
            <div className="flex space-x-8 text-orange-200">
              <a href="#about" className="hover:text-amber-400 transition-colors">About Bunjil</a>
              <a href="#cultural-respect" className="hover:text-amber-400 transition-colors">Cultural Respect</a>
              <a href="#conservation" className="hover:text-amber-400 transition-colors">Conservation</a>
              <a href="#support" className="hover:text-amber-400 transition-colors">Support</a>
            </div>
          </div>
          
          <div className="text-center mt-8 text-orange-300 text-sm">
            <p>Developed with deep respect for Aboriginal culture and Traditional Owners of the land.</p>
            <p className="mt-2">Bunjil AI represents ancient wisdom through modern technology.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;