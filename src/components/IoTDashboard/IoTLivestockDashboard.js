import React, { useEffect, useState, useRef, useCallback } from 'react';
import logo from '../../assets/logo_white.png';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap, // Hook to access the Leaflet map instance
} from 'react-leaflet';
import L from 'leaflet'; // Leaflet core library
import 'leaflet/dist/leaflet.css'; // Leaflet base CSS
// Leaflet Draw for drawing tools (polygons for geofencing)
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

// Lucide React for icons (ensure you have installed it: npm install lucide-react)
import { MapPin, Zap, Users, AlertTriangle, Shield, Activity, Wifi, Battery, Navigation,Volume2} from 'lucide-react';

// Firebase imports for Realtime Database
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, remove } from 'firebase/database';

// 🚨🚨🚨 IMPORTANT: REPLACE WITH YOUR ACTUAL FIREBASE CONFIGURATION 🚨🚨🚨
const iotFirebaseConfig = {
  apiKey: "AIzaSyDaw8OdK1eaMCcOJgB6lHDFGn_hb9YIEdM", 
  authDomain: "agrorithm-f4d87.firebaseapp.com", 
  databaseURL: "https://agrorithm-f4d87-default-rtdb.firebaseio.com", 
  projectId: "agrorithm-f4d87", 
  storageBucket: "agrorithm-f4d87.firebasestorage.app", 
  messagingSenderId: "1084500546652", 
  appId: "1:1084500546652:web:c2a251d9585f7211448299" 
};

// Initialize Firebase for IoT data
// We use a named app 'iot-app' to avoid conflicts if other Firebase apps are initialized.
const iotApp = initializeApp(iotFirebaseConfig, 'iot-app');
const iotDb = getDatabase(iotApp);

// -----------------------------------------------------------------------------
// LEAFLET ICON FIXES AND CUSTOM ICONS
// -----------------------------------------------------------------------------

// Due to potential issues with `require` in some environments or direct CDN use,
// it's safer to use imports or direct URLs for the default Leaflet icons if they are not picked up.
// For a standard React project using a bundler like Webpack or Vite, the default
// `import 'leaflet/dist/leaflet.css'` often correctly resolves these image paths.
// If not, you might need specific loader configurations or manually set the URLs like below:
if (typeof window !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
}


// Custom cow marker icon (SVG data URL for self-containment)
const cowIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <circle cx="16" cy="16" r="14" fill="#8B4513" stroke="#654321" stroke-width="2"/>
      <circle cx="16" cy="16" r="10" fill="#A0522D"/>
      <text x="16" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="bold">🐄</text>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Alarm icon for restricted areas (SVG data URL)
const alarmIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <circle cx="16" cy="16" r="14" fill="#FF0000" stroke="#CC0000" stroke-width="2"/>
      <polygon points="16,6 12,22 20,22" fill="white"/>
      <circle cx="16" cy="26" r="2" fill="white"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// -----------------------------------------------------------------------------
// Leaflet Draw Control Component
// -----------------------------------------------------------------------------
const DrawControl = ({ onCreated, onDeleted, drawType }) => {
  const map = useMap(); // Get the Leaflet map instance
  const drawnItemsRef = useRef(new L.FeatureGroup()); // Ref to store drawn layers

  useEffect(() => {
    if (!map) return;

    // Add FeatureGroup to map to manage drawn layers
    map.addLayer(drawnItemsRef.current);

    // Initialize Leaflet.draw control
    // Only allow drawing polygons for now, edit and delete for existing layers
    const drawControl = new L.Control.Draw({
      draw: {
        polygon: {
          shapeOptions: {
            color: drawType === 'grazing' ? 'green' : 'red', // Dynamic color based on drawType
            fillOpacity: 0.4,
          },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: {
        featureGroup: drawnItemsRef.current, // Allow editing/deleting layers in this group
        remove: true,
      },
    });

    // Add the control to the map
    map.addControl(drawControl);

    // Event listener for when a new shape is created
    map.on(L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;
      drawnItemsRef.current.addLayer(layer); // Add the newly drawn layer to the feature group

      // Extract coordinates from the drawn polygon
      const latlngs = layer.getLatLngs()[0].map((latlng) => ({
        lat: latlng.lat,
        lng: latlng.lng,
      }));
      onCreated(latlngs, drawType); // Pass coordinates and type to parent handler
    });

    // Event listener for when shapes are deleted
    map.on(L.Draw.Event.DELETED, (e) => {
      e.layers.eachLayer((layer) => {
        onDeleted(layer); // Pass the deleted layer to parent handler
      });
    });

    // Cleanup function: remove event listeners and control when component unmounts
    return () => {
      map.off(L.Draw.Event.CREATED);
      map.off(L.Draw.Event.DELETED);
      map.removeControl(drawControl);
      map.removeLayer(drawnItemsRef.current);
    };
  }, [map, onCreated, onDeleted, drawType]); // Re-run effect if map, handlers, or drawType changes

  return null;
};


// -----------------------------------------------------------------------------
// Main IoT Livestock Dashboard Component
// -----------------------------------------------------------------------------
const IoTLivestockDashboard = ({ userRole = 'farmer' }) => {
  const [livestockData, setLivestockData] = useState({}); // Stores all livestock data from Firebase
  const [grazingAreas, setGrazingAreas] = useState([]); // Stores defined grazing polygons
  const [nonGrazingAreas, setNonGrazingAreas] = useState([]); // Stores defined non-grazing polygons
  const [drawType, setDrawType] = useState('grazing'); // Current type of area being drawn ('grazing' or 'non-grazing')
  const [alarms, setAlarms] = useState([]); // Stores active alarms
  const [messageBox, setMessageBox] = useState({ visible: false, message: '', type: '' }); // For custom alerts

    /**
   * Plays the alarm sound.
   */
  const playAlarmSound = useCallback(() => {
    if (typeof Audio !== 'undefined') {
      try {
        const audio = new Audio('/alarm.mp3'); // Assuming 'alarm.mp3' is in the public folder or accessible via root
        audio.volume = 0.7; // Set a default volume
        audio.play()
          .then(() => console.log('Alarm sound played successfully.'))
          .catch(e => {
            // Log specific error for autoplay policy or other issues
            console.error('Error playing alarm sound:', e);
            showMessageBox('Alarm sound blocked by browser (autoplay policy). Please click anywhere on the page to enable sound.', 'warning');
          });
      } catch (e) {
        console.error('Failed to create Audio object:', e);
        showMessageBox('Audio playback not supported or file not found.', 'error');
      }
    } else {
      console.log('Audio notification not available in this environment.');
    }
  }, []);


  /**
   * Displays a custom message box instead of alert().
   * @param {string} message - The message to display.
   * @param {string} type - 'success', 'error', 'warning', 'info'.
   */
  const showMessageBox = (message, type) => {
    setMessageBox({ visible: true, message, type });
  };

  /**
   * Hides the custom message box.
   */
  const hideMessageBox = () => {
    setMessageBox({ visible: false, message: '', type: '' });
  };

  // Point-in-polygon algorithm (Ray Casting Algorithm)
  // Checks if a given point is inside a polygon.
  const isPointInPolygon = useCallback((point, polygon) => {
    const x = point.lat, y = point.lng;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng;
      const xj = polygon[j].lat, yj = polygon[j].lng;
      
      // Check for horizontal intersection
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) {
        inside = !inside;
      }
    }
    return inside;
  }, []); // No dependencies, as it's a pure function

  // Check geofencing violations for a given animal position
  const checkGeofencing = useCallback((animalId, position) => {
    // Check if in non-grazing (restricted) area
    let isViolating = false;
    for (const area of nonGrazingAreas) {
      if (isPointInPolygon(position, area.coords)) {
        isViolating = true;
        const alarmExists = alarms.some(alarm => alarm.animalId === animalId && alarm.type === 'RESTRICTED_AREA_VIOLATION');
        if (!alarmExists) {
          const alarmId = `${animalId}_${Date.now()}`;
          const newAlarm = {
            id: alarmId,
            animalId,
            position,
            timestamp: new Date().toISOString(),
            type: 'RESTRICTED_AREA_VIOLATION',
            message: `Animal ${animalId} entered restricted area!`
          };
          setAlarms(prev => [...prev, newAlarm]);
          // Play alarm sound (you can replace with actual audio)
          if (typeof Audio !== 'undefined') {
              try {
           const audio = new Audio('/agrorithm_alarm.mp3'); // Assuming 'alarm.mp3' is in the public folder or accessible via root
              audio.play().catch(console.error); // Catch potential errors like user interaction required for autoplay
            } catch (e) {
              console.log('Audio notification not available:', e);
            }
          }
          showMessageBox(`Alert: Animal ${animalId} entered restricted area!`, 'error');
        }
        break; // Found a violation, no need to check other non-grazing areas for this animal
      }
    }
    // Remove alarm if animal is no longer in restricted area
    if (!isViolating) {
        setAlarms(prev => prev.filter(alarm => !(alarm.animalId === animalId && alarm.type === 'RESTRICTED_AREA_VIOLATION')));
    }
  }, [nonGrazingAreas, alarms, isPointInPolygon]); // Dependencies for useCallback

  // Effect to listen to IoT livestock data from Firebase Realtime Database
  useEffect(() => {
    // Listen to the root of the database to capture all top-level nodes including 'latest_position'
    // and individual 'offline_XXXXX' nodes.
    const livestockRef = ref(iotDb, '/'); 
    const unsubscribe = onValue(livestockRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLivestockData(data); // Update local state with fetched data
        
        // Check geofencing for each animal's latest position and the main device
        // Iterate through all top-level keys
        Object.keys(data).forEach(key => {
          // If the key is 'latest_position' (main device's position)
          if (key === 'latest_position' && data[key]?.latitude && data[key]?.longitude) {
            const position = {
              lat: data[key].latitude,
              lng: data[key].longitude
            };
            checkGeofencing('main_device', position); // Use 'main_device' as ID
          }
          // If the key starts with 'offline_' (assuming these are individual animal IDs)
          // and contains a 'latest_position' object within it
          else if (key.startsWith('offline_') && data[key]?.latest_position?.latitude && data[key]?.latest_position?.longitude) {
            const position = {
              lat: data[key].latest_position.latitude,
              lng: data[key].latest_position.longitude
            };
            checkGeofencing(key, position); // Use the 'offline_XXXXX' key as ID
          }
          // If there's a 'gps_data' node and it contains nested animal data (assuming structure like gps_data/animalId/latest_position)
          // This part would need further refinement if 'gps_data' actually holds multiple animal data directly.
          // For now, we'll assume individual animals are at the root or main_device is at root.
          // If your `gps_data` node also contains animal positions, you'd need another `onValue` or
          // iterate through `data.gps_data` here.
          // Example for iterating gps_data if it contains sub-animal IDs:
          /*
          else if (key === 'gps_data' && typeof data[key] === 'object') {
              Object.keys(data[key]).forEach(animalGpsId => {
                  if (data[key][animalGpsId]?.latest_position?.latitude && data[key][animalGpsId]?.latest_position?.longitude) {
                      const position = {
                          lat: data[key][animalGpsId].latest_position.latitude,
                          lng: data[key][animalGpsId].latest_position.longitude
                      };
                      checkGeofencing(animalGpsId, position);
                  }
              });
          }
          */
        });
      } else {
        // If snapshot doesn't exist, data is empty
        setLivestockData({});
        setAlarms([]); // Clear alarms if no data
      }
    }, (error) => {
      console.error("Error fetching livestock data from Firebase:", error);
      showMessageBox(`Failed to load livestock data: ${error.message}`, 'error');
    });

    // Cleanup function: unsubscribe from Firebase listener when component unmounts
    return () => unsubscribe();
  }, [checkGeofencing]); // Re-run effect if checkGeofencing changes (due to its dependencies)

  // Effect to listen to geofencing areas from Firebase Realtime Database
  useEffect(() => {
    const areasRef = ref(iotDb, 'geofencing_areas');
    const unsubscribe = onValue(areasRef, (snapshot) => {
      if (snapshot.exists()) {
        const areas = snapshot.val();
        const grazing = [], nonGrazing = [];
        
        // Categorize areas into grazing and non-grazing based on their 'type' property
        Object.keys(areas).forEach(areaId => {
          const area = areas[areaId];
          if (area.type === 'grazing') {
            grazing.push({ id: areaId, coords: area.coordinates });
          } else if (area.type === 'non-grazing') {
            nonGrazing.push({ id: areaId, coords: area.coordinates });
          }
        });
        
        setGrazingAreas(grazing);
        setNonGrazingAreas(nonGrazing);
      } else {
        setGrazingAreas([]);
        setNonGrazingAreas([]);
      }
    }, (error) => {
      console.error("Error fetching geofencing areas from Firebase:", error);
      showMessageBox(`Failed to load geofencing areas: ${error.message}`, 'error');
    });

    // Cleanup function: unsubscribe from Firebase listener
    return () => unsubscribe();
  }, []);

  /**
   * Handles the creation of a new polygon (geofence) by the drawing tool.
   * Saves the new area to Firebase Realtime Database.
   * @param {Array<Object>} latlngs - Array of {lat, lng} objects representing polygon coordinates.
   * @param {string} type - The type of area ('grazing' or 'non-grazing').
   */
  const handleCreated = useCallback(async (latlngs, type) => {
    try {
      const areasRef = ref(iotDb, 'geofencing_areas');
      const newAreaRef = push(areasRef); // Generate a unique ID for the new area
      await set(newAreaRef, {
        type: type, // Store the type (grazing or non-grazing)
        coordinates: latlngs, // Store the polygon coordinates
        created_at: new Date().toISOString(),
      });
      showMessageBox(`New ${type} area saved successfully!`, 'success');
    } catch (err) {
      console.error("Error saving polygon to Firebase:", err);
      showMessageBox(`Error saving area: ${err.message}`, 'error');
    }
  }, []); // No dependencies for this callback

  /**
   * Handles the deletion of a polygon (geofence) by the drawing tool.
   * Removes the corresponding area from Firebase Realtime Database.
   * @param {L.Layer} layer - The Leaflet layer object that was deleted.
   */
  const handleDeleted = useCallback(async (layer) => {
    // Extract coordinates from the deleted Leaflet layer to match with stored data
    const latlngs = layer.getLatLngs()[0].map((ll) => ({
      lat: ll.lat,
      lng: ll.lng,
    }));
    
    // Combine all areas to find the one that matches the deleted layer
    const allAreas = [...grazingAreas, ...nonGrazingAreas];
    for (const area of allAreas) {
      // Simple coordinate comparison for matching (might need more robust matching for real-world)
      if (area.coords.length === latlngs.length) {
        const matched = area.coords.every((pt, i) =>
          Math.abs(pt.lat - latlngs[i].lat) < 0.00001 &&
          Math.abs(pt.lng - latlngs[i].lng) < 0.00001
        );
        if (matched) {
          try {
            // Remove the matched area from Firebase
            const areaRef = ref(iotDb, `geofencing_areas/${area.id}`);
            await remove(areaRef);
            showMessageBox(`Area deleted successfully!`, 'success');
            break; // Exit loop once matched area is found and deleted
          } catch (err) {
            console.error("Error deleting polygon from Firebase:", err);
            showMessageBox(`Error deleting area: ${err.message}`, 'error');
          }
        }
      }
    }
  }, [grazingAreas, nonGrazingAreas]); // Dependencies for useCallback

  /**
   * Dismisses an alarm from the active alarms list.
   * @param {string} alarmId - The ID of the alarm to dismiss.
   */
  const dismissAlarm = (alarmId) => {
    setAlarms(prev => prev.filter(alarm => alarm.id !== alarmId));
    showMessageBox(`Alarm ${alarmId} dismissed.`, 'info');
  };

  /**
   * Determines the initial map center based on available livestock data.
   * Prioritizes 'latest_position' at the root, then the first animal's position,
   * otherwise defaults to a general Nigeria coordinate.
   * @returns {Array<number>} [latitude, longitude] for map center.
   */
  const getMapCenter = useCallback(() => {
    if (livestockData.latest_position) {
      return [livestockData.latest_position.latitude, livestockData.latest_position.longitude];
    }
    
    // Check if any of the 'offline_XXXXX' nodes have a latest_position
    const animalIds = Object.keys(livestockData).filter(id => id.startsWith('offline_') && livestockData[id]?.latest_position);
    if (animalIds.length > 0) {
      const firstAnimalPos = livestockData[animalIds[0]].latest_position;
      return [firstAnimalPos.latitude, firstAnimalPos.longitude];
    }
    
    return [9.0820, 8.6753]; // Default to a general Nigeria coordinate
  }, [livestockData]); // Recalculate if livestockData changes

  /**
   * Generates an array of marker data for all animals and the main device (if present).
   * Includes position, raw data, and whether it's in a restricted area.
   * @returns {Array<Object>} Array of marker objects.
   */
  const getAnimalMarkers = useCallback(() => {
    const markers = [];
    
    // Add Main Device position if available (from root latest_position)
    if (livestockData.latest_position) {
      const pos = livestockData.latest_position;
      const isInRestrictedArea = nonGrazingAreas.some(area => 
        isPointInPolygon({ lat: pos.latitude, lng: pos.longitude }, area.coords)
      );
      
      markers.push({
        id: 'main_device', // Unique ID for the main device marker
        name: 'Main Device', // Display name for the main device
        position: [pos.latitude, pos.longitude],
        data: pos, // Raw IoT data for popup
        isInRestrictedArea,
      });
    }
    
    // Add Individual animal positions from 'offline_XXXXX' nodes
    Object.keys(livestockData).forEach(animalId => {
      if (animalId.startsWith('offline_') && livestockData[animalId]?.latest_position) {
        const pos = livestockData[animalId].latest_position;
        // You might want to get a more friendly name for the animal here if available in Firebase
        const animalName = `Animal ${animalId.replace('offline_', '')}`; 
        const isInRestrictedArea = nonGrazingAreas.some(area => 
          isPointInPolygon({ lat: pos.latitude, lng: pos.longitude }, area.coords)
        );
        
        markers.push({
          id: animalId,
          name: animalName,
          position: [pos.latitude, pos.longitude],
          data: pos,
          isInRestrictedArea,
        });
      }
    });

    // Note: If `gps_data` node contains nested animal data (e.g., gps_data/COW-001/latest_position),
    // you would need additional logic here to iterate through `livestockData.gps_data`
    // and add markers for those as well.
    
    return markers;
  }, [livestockData, nonGrazingAreas, isPointInPolygon]); // Recalculate if data or areas change

  // Memoized values for performance
  const animalMarkers = getAnimalMarkers();
  const mapCenter = getMapCenter();

  // Calculate summary statistics for the dashboard
  const totalAnimalsOnMap = animalMarkers.length; // Number of unique markers shown
  const totalGrazingAreas = grazingAreas.length;
  const totalNonGrazingAreas = nonGrazingAreas.length;
  const totalActiveAlarms = alarms.length;

  return (
    // Main container with dark gradient background and Inter font
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1a4e33] to-slate-900 font-inter text-white p-4">
      {/* Header Section */}
      <div className="relative overflow-hidden mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/40 to-[#2e8b57]/40"></div>
        <div className="relative px-4 py-6 md:px-8 lg:px-12">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="text-center sm:text-left mb-4 sm:mb-0">
              <img
                src={logo}
                alt="AgroRithm Platform"
                className="nav-logo"
              />
              <h1 className="text-4xl sm:text-5xl font-bold mb-2 tracking-tight">
               IoT Livestock Dashboard
              </h1>
              <p className="text-[#66cdaa] text-lg sm:text-xl">
                Advanced Real-time Monitoring & Geofencing
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <div className="w-2 h-2 bg-[#3cb371] rounded-full animate-pulse"></div>
                <span className="text-white text-sm font-medium">Live</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-3">
                <Wifi className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Message Box (instead of alert) */}
      {messageBox.visible && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl ${
            messageBox.type === 'error' ? 'bg-red-600' :
            messageBox.type === 'success' ? 'bg-[#2e8b57]' :
            messageBox.type === 'info' ? 'bg-blue-600' : 'bg-gray-600'
          } text-white flex items-center justify-between space-x-4`}
        >
          <span>{messageBox.message}</span>
          <button onClick={hideMessageBox} className="font-bold text-white hover:text-gray-200">
            &times;
          </button>
        </div>
      )}

      {/* Alarms Panel (conditionally rendered) */}
      {alarms.length > 0 && (
        <div className="mx-4 mb-6 md:mx-8 lg:mx-12">
          <div className="bg-red-700/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 shadow-lg">
            <h3 className="text-xl font-semibold text-red-300 mb-4 flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-400 mr-3" />
              Active Alerts ({alarms.length})
            </h3>
            <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
              {alarms.map(alarm => (
                <div key={alarm.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-red-800/10 border border-red-600/20 rounded-xl p-4">
                  <div className="flex items-start sm:items-center space-x-3 mb-3 sm:mb-0">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse flex-shrink-0 mt-1 sm:mt-0"></div>
                    <div>
                      <p className="text-white font-medium">{alarm.message}</p>
                      <p className="text-red-200 text-sm">
                        {alarm.animalId} • {new Date(alarm.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlarm(alarm.id)}
                    className="px-4 py-2 bg-red-600/40 hover:bg-red-600/60 text-red-200 rounded-lg transition-all duration-200 font-medium self-end sm:self-center focus:outline-none focus:ring-2 focus:ring-red-400"
                  >
                    Dismiss
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4 mb-8 md:px-8 lg:px-12">
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-md hover:bg-white/15 transition-all duration-300 cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#2e8b57]/20 rounded-xl p-3">
              <Users className="w-6 h-6 text-[#3cb371]" />
            </div>
            <span className="text-3xl font-bold text-white">{totalAnimalsOnMap}</span>
          </div>
          <h3 className="text-[#66cdaa] font-semibold mb-1">Animals Tracked</h3>
          <p className="text-[#98fb98] text-sm">Currently on map</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-md hover:bg-white/15 transition-all duration-300 cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#2e8b57]/20 rounded-xl p-3">
              <Shield className="w-6 h-6 text-[#3cb371]" />
            </div>
            <span className="text-3xl font-bold text-white">{totalGrazingAreas}</span>
          </div>
          <h3 className="text-[#66cdaa] font-semibold mb-1">Grazing Areas</h3>
          <p className="text-[#98fb98] text-sm">Managed zones</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-md hover:bg-white/15 transition-all duration-300 cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-red-500/20 rounded-xl p-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
            </div>
            <span className="text-3xl font-bold text-white">{totalNonGrazingAreas}</span>
          </div>
          <h3 className="text-red-200 font-semibold mb-1">Restricted Areas</h3>
          <p className="text-[#98fb98] text-sm">Monitored zones</p>
        </div>
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-md hover:bg-white/15 transition-all duration-300 cursor-default">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-[#2e8b57]/20 rounded-xl p-3">
              <Zap className="w-6 h-6 text-[#3cb371]" />
            </div>
            <span className="text-3xl font-bold text-white">{totalActiveAlarms}</span>
          </div>
          <h3 className="text-[#66cdaa] font-semibold mb-1">Active Alarms</h3>
          <p className="text-[#98fb98] text-sm">Requiring attention</p>
        </div>
      </div>

      {/* Geofencing Controls (only for admin/farmer roles) */}
      {(userRole === 'admin' || userRole === 'farmer') && (
        <div className="mx-4 mb-6 md:mx-8 lg:mx-12 p-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-md">
          <h3 className="text-lg font-semibold text-white mb-3">Geofencing Controls</h3>
          <p className="text-white/70 text-sm mb-4">Select an area type to draw on the map. Click the draw polygon icon on the map to start drawing. Click the edit/delete icon to modify existing areas.</p>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center text-white/90 cursor-pointer">
              <input
                type="radio"
                value="grazing"
                checked={drawType === 'grazing'}
                onChange={() => setDrawType('grazing')}
                className="mr-2 h-4 w-4 text-[#2e8b57] border-gray-300 focus:ring-[#2e8b57]"
              />
              <span className="text-[#3cb371] font-medium">Grazing Area</span>
            </label>
            <label className="flex items-center text-white/90 cursor-pointer">
              <input
                type="radio"
                value="non-grazing"
                checked={drawType === 'non-grazing'}
                onChange={() => setDrawType('non-grazing')}
                className="mr-2 h-4 w-4 text-red-500 border-gray-300 focus:ring-red-500"
              />
              <span className="text-red-400 font-medium">Restricted Area</span>
            </label>
          </div>
        </div>
      )}

        {/* Test Alarm Sound Button */}
      {/* <div className="mx-4 mb-6 md:mx-8 lg:mx-12 text-center">
        <button
          onClick={playAlarmSound}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-[#2e8b57] hover:bg-[#3cb371] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2e8b57] transition-all duration-200"
        >
          <Volume2 className="h-5 w-5 mr-2" />
          Test Alarm Sound
        </button>
        <p className="mt-2 text-white/70 text-xs">If you can hear this, the MP3 file is accessible. Automatic alarms might be blocked by browser autoplay policies.</p>
      </div> */}

      

      {/* Interactive Map */}
      <div className="mx-4 mb-6 md:mx-8 lg:mx-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl overflow-hidden shadow-xl">
        <h3 className="text-xl font-semibold text-white p-6 pb-4 flex items-center">
          <Navigation className="w-5 h-5 mr-3" />
          Real-time Livestock Map
        </h3>
        <div className="w-full h-[600px] bg-gray-800"> {/* Map container must have defined height */}
          <MapContainer center={mapCenter} zoom={15} scrollWheelZoom={true} className="h-full w-full rounded-b-2xl">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />

            {/* Animal Markers */}
            {animalMarkers.map((animal) => (
              <Marker
                key={animal.id}
                position={animal.position}
                icon={animal.isInRestrictedArea ? alarmIcon : cowIcon}
              >
                <Popup>
                  <div className="p-2 text-gray-800">
                    <h4 className="font-bold text-lg mb-2">
                      {animal.name || `Animal ${animal.id}`}
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p><strong>Coordinates:</strong> {animal.data.latitude?.toFixed(6)}, {animal.data.longitude?.toFixed(6)}</p>
                      <p><strong>Altitude:</strong> {animal.data.altitude}m</p>
                      <p><strong>Speed:</strong> {animal.data.speed_kmph} km/h</p>
                      <p><strong>Course:</strong> {animal.data.course}°</p>
                      <p><strong>Satellites:</strong> {animal.data.satellites}</p>
                      <p><strong>Date:</strong> {animal.data.date}</p>
                      <p><strong>Time:</strong> {animal.data.time}</p>
                      {animal.isInRestrictedArea && (
                        <p className="text-red-600 font-bold mt-2">⚠️ IN RESTRICTED AREA!</p>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Grazing Areas Polygons */}
            {grazingAreas.map(({ id, coords }) => (
              <Polygon
                key={id}
                positions={coords.map((pt) => [pt.lat, pt.lng])}
                pathOptions={{ color: '#2e8b57', fillColor: '#2e8b57', fillOpacity: 0.3, weight: 2 }}
              >
                <Popup>Grazing Area</Popup>
              </Polygon>
            ))}

            {/* Non-Grazing Areas Polygons */}
            {nonGrazingAreas.map(({ id, coords }) => (
              <Polygon
                key={id}
                positions={coords.map((pt) => [pt.lat, pt.lng])}
                pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.3, weight: 2 }}
              >
                <Popup>Restricted Area</Popup>
              </Polygon>
            ))}

            {/* Leaflet Draw Controls - conditionally rendered based on role */}
            {(userRole === 'admin' || userRole === 'farmer') && (
              <DrawControl
                drawType={drawType}
                onCreated={handleCreated}
                onDeleted={handleDeleted}
              />
            )}
          </MapContainer>
        </div>
      </div>

      {/* Live Data Panel */}
      <div className="mx-4 pb-4 md:mx-8 lg:mx-12 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Live IoT Data Details</h3>
        {animalMarkers.length === 0 ? (
          <p className="text-white/70">No livestock data available. Ensure your Firebase is configured and devices are sending data.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {animalMarkers.map(animal => (
              <div key={animal.id} className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  animal.isInRestrictedArea ? 'bg-red-800/20 border-red-500 animate-pulse-slow' : 'bg-white/5 border-white/10'
                }`}
              >
                <h4 className="font-semibold text-lg mb-2 flex items-center">
                  {animal.name}
                  {animal.isInRestrictedArea && <span className="text-red-400 ml-2 text-2xl leading-none">🚨</span>}
                </h4>
                <div className="text-sm space-y-1 text-white/80">
                  <p className="flex items-center">📍 <span className="ml-2">{animal.data.latitude?.toFixed(4)}, {animal.data.longitude?.toFixed(4)}</span></p>
                  <p className="flex items-center">🏔️ <span className="ml-2">{animal.data.altitude}m</span></p>
                  <p className="flex items-center">🏃 <span className="ml-2">{animal.data.speed_kmph} km/h</span></p>
                  <p className="flex items-center">🧭 <span className="ml-2">{animal.data.course}°</span></p>
                  <p className="flex items-center">🛰️ <span className="ml-2">{animal.data.satellites} sats</span></p>
                  <p className="flex items-center">🔋 <span className="ml-2">{animal.data.battery_percentage}%</span></p> {/* Assuming battery data exists */}
                  <p className="flex items-center">🕒 <span className="ml-2">{animal.data.time || new Date().toLocaleTimeString()}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Raw Data View */}
      <div className="mx-4 pb-8 md:mx-8 lg:mx-12 text-center text-white/60 text-sm">
        <p>Current Raw Data from Real time Database (Firebase):</p>
        <pre className="bg-white/5 p-4 rounded-lg mt-2 text-left overflow-x-auto text-xs md:text-sm h-64 overflow-y-auto custom-scrollbar">
          {Object.keys(livestockData).length > 0 ? (
            <code>{JSON.stringify(livestockData, null, 2)}</code>
          ) : (
            <p className="text-white/70">No raw data received from Firebase yet. Ensure your IoT devices are sending data to the configured Realtime Database paths (e.g., `latest_position`, `offline_XXXXX`).</p>
          )}
        </pre>
        <p className="mt-4">This section displays the full JSON object as received by the dashboard from your Firebase Realtime Database.</p>
      </div>

      {/* Custom Scrollbar Styling for overflow-y-auto */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 10px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
};

export default IoTLivestockDashboard;
