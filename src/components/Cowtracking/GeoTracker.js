// src/components/Cowtracking/GeoTracker.js
import React, { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  query,
  
 
} from 'firebase/firestore';
import { app } from '../../firebase/firebase';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const db = getFirestore(app);

// Offline storage helper functions
const saveOfflineData = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const getOfflineData = (key) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error reading from localStorage:', error);
    return null;
  }
};

// Custom marker icons for different user types
const herderIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const cowIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [20, 33],
  iconAnchor: [10, 33],
  popupAnchor: [1, -28],
  shadowSize: [33, 33]
});

const DrawControl = ({ onCreated, onDeleted }) => {
  const map = useMap();
  const drawControlRef = useRef();

  useEffect(() => {
    if (!map) return;

    const drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    const drawControl = new L.Control.Draw({
      draw: {
        polygon: true,
        polyline: false,
        rectangle: false,
        circle: false,
        circlemarker: false,
        marker: false,
      },
      edit: { featureGroup: drawnItems, remove: true },
    });
    drawControlRef.current = drawControl;
    map.addControl(drawControl);

    map.on(L.Draw.Event.CREATED, (e) => {
      const layer = e.layer;
      drawnItems.addLayer(layer);
      const latlngs = layer.getLatLngs()[0].map((latlng) => ({
        lat: latlng.lat,
        lng: latlng.lng,
      }));
      onCreated(latlngs, layer);
    });

    map.on(L.Draw.Event.DELETED, (e) => {
      e.layers.eachLayer((layer) => {
        onDeleted(layer);
      });
    });

    return () => {
      map.off(L.Draw.Event.CREATED);
      map.off(L.Draw.Event.DELETED);
      map.removeControl(drawControl);
      map.removeLayer(drawnItems);
    };
  }, [map, onCreated, onDeleted]);

  return null;
};

const GeoTracker = ({ userRole }) => {
  const [cowMarkers, setCowMarkers] = useState([]);
  const [herderLocations, setHerderLocations] = useState([]);
  const [grazingAreas, setGrazingAreas] = useState([]);
  const [nonGrazingAreas, setNonGrazingAreas] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [drawType, setDrawType] = useState('grazing');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [showOfflineData, setShowOfflineData] = useState(false);

  // Monitor online/offline
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch and cache area polygons
  useEffect(() => {
    if (isOffline) {
      loadCachedAreas();
      return;
    }

    const q = query(collection(db, 'areas'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const grazing = [], nonGrazing = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'grazing') grazing.push({ id: doc.id, coords: data.coordinates });
        else if (data.type === 'non-grazing') nonGrazing.push({ id: doc.id, coords: data.coordinates });
      });
      setGrazingAreas(grazing);
      setNonGrazingAreas(nonGrazing);

      // Cache for offline use
      saveOfflineData('cached-grazing-areas-farmer', grazing);
      saveOfflineData('cached-non-grazing-areas-farmer', nonGrazing);
    }, (err) => {
      console.error("Error fetching areas:", err);
      loadCachedAreas();
    });

    return () => unsubscribe();
  }, [isOffline]);

  const loadCachedAreas = () => {
    const grazing = getOfflineData('cached-grazing-areas-farmer') || [];
    const nonGrazing = getOfflineData('cached-non-grazing-areas-farmer') || [];
    setGrazingAreas(grazing);
    setNonGrazingAreas(nonGrazing);
  };

  // Get user's current location
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.warn("Location access error:", err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Fetch cow locations (livestock tracking devices)
  useEffect(() => {
    if (isOffline) {
      loadCachedLivestock();
      return;
    }

    const unsub = onSnapshot(collection(db, 'cowLocations'), (snapshot) => {
      const cows = [];
      const herders = [];
      
   // Replace lines 134-143 with this fixed version:

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        
        // Helper function to safely convert timestamp
        const getTimestamp = (timestamp) => {
          if (!timestamp) return new Date();
          
          // If it's a Firestore Timestamp object
          if (timestamp && typeof timestamp.toDate === 'function') {
            return timestamp.toDate();
          }
          
          // If it's already a Date object
          if (timestamp instanceof Date) {
            return timestamp;
          }
          
          // If it's a string or number, try to convert
          return new Date(timestamp);
        };
        
        if (data.userType === 'herder') {
          herders.push({
            ...data,
            id: doc.id,
            lastUpdate: getTimestamp(data.timestamp)
          });
        } else {
          // Assume it's a cow/livestock if no userType specified
          cows.push({
            ...data,
            id: doc.id,
            lastUpdate: getTimestamp(data.timestamp)
          });
        }
      });
      
      setCowMarkers(cows);
      setHerderLocations(herders);
      setLastUpdateTime(new Date());
      
      // Cache for offline viewing
      saveOfflineData('cached-cow-locations', cows);
      saveOfflineData('cached-herder-locations', herders);
    }, (err) => {
      console.error("Error fetching locations:", err);
      loadCachedLivestock();
    });

    return () => unsub();
  }, [isOffline]);

  const loadCachedLivestock = () => {
    const cachedCows = getOfflineData('cached-cow-locations') || [];
    const cachedHerders = getOfflineData('cached-herder-locations') || [];
    setCowMarkers(cachedCows);
    setHerderLocations(cachedHerders);
    
    // Also load any offline herder positions
    if (showOfflineData) {
      loadOfflineHerderPositions();
    }
  };

  // Load offline herder positions from localStorage
  const loadOfflineHerderPositions = () => {
    const offlineHerders = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('latest-location-')) {
        const userId = key.replace('latest-location-', '');
        const data = getOfflineData(key);
        if (data) {
          offlineHerders.push({
            ...data,
            id: userId,
            isOffline: true,
            lastUpdate: new Date(data.timestamp)
          });
        }
      }
    }
    
    // Merge with existing herder locations
    const mergedHerders = [...herderLocations];
    offlineHerders.forEach(offlineHerder => {
      const existingIndex = mergedHerders.findIndex(h => h.id === offlineHerder.id);
      if (existingIndex >= 0) {
        // Update with offline data if it's more recent
        if (offlineHerder.lastUpdate > mergedHerders[existingIndex].lastUpdate) {
          mergedHerders[existingIndex] = offlineHerder;
        }
      } else {
        mergedHerders.push(offlineHerder);
      }
    });
    
    setHerderLocations(mergedHerders);
  };

  const handleCreated = async (latlngs) => {
    if (isOffline) {
      alert("Cannot create areas while offline. Please try again when connected.");
      return;
    }

    try {
      await addDoc(collection(db, 'areas'), {
        type: drawType,
        coordinates: latlngs,
        createdAt: new Date(),
        createdBy: userRole,
      });
    } catch (err) {
      console.error("Error saving polygon:", err);
      alert("Error saving area. Please try again.");
    }
  };

  const handleDeleted = async (layer) => {
    if (isOffline) {
      alert("Cannot delete areas while offline. Please try again when connected.");
      return;
    }

    const latlngs = layer.getLatLngs()[0].map((ll) => ({
      lat: ll.lat,
      lng: ll.lng,
    }));
    const allAreas = [...grazingAreas, ...nonGrazingAreas];
    for (const area of allAreas) {
      if (area.coords.length === latlngs.length) {
        const matched = area.coords.every((pt, i) =>
          Math.abs(pt.lat - latlngs[i].lat) < 0.00001 &&
          Math.abs(pt.lng - latlngs[i].lng) < 0.00001
        );
        if (matched) {
          try {
            await deleteDoc(doc(db, 'areas', area.id));
            break;
          } catch (err) {
            console.error("Error deleting polygon:", err);
            alert("Error deleting area. Please try again.");
          }
        }
      }
    }
  };

  const mapCenter =
    userLocation || (cowMarkers[0]?.lat && cowMarkers[0]?.lon
      ? [cowMarkers[0].lat, cowMarkers[0].lon]
      : herderLocations[0]?.lat && herderLocations[0]?.lon
      ? [herderLocations[0].lat, herderLocations[0].lon]
      : [9.082, 8.6753]); // default Nigeria center

  const getTimeSinceUpdate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000); // seconds
    
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
  };

  return (
    <div>
      <h2>
        Geo Cow Tracker 
        {isOffline ? ' (Offline Mode)' : ''}
      </h2>

      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '14px', marginBottom: '10px' }}>
          {isOffline ? (
            <div style={{ color: 'orange' }}>
              🔴 Offline - Showing cached data
              <label style={{ marginLeft: '15px', fontSize: '12px' }}>
                <input 
                  type="checkbox" 
                  checked={showOfflineData} 
                  onChange={(e) => {
                    setShowOfflineData(e.target.checked);
                    if (e.target.checked) {
                      loadOfflineHerderPositions();
                    }
                  }}
                />
                Show offline herder positions
              </label>
            </div>
          ) : (
            <div style={{ color: 'green' }}>
              🟢 Online - Live tracking active
              {lastUpdateTime && (
                <span style={{ marginLeft: '10px', fontSize: '12px' }}>
                  Last update: {lastUpdateTime.toLocaleTimeString()}
                </span>
              )}
            </div>
          )}
        </div>

        <div style={{ fontSize: '12px', color: '#666' }}>
          📍 Showing: {cowMarkers.length} livestock, {herderLocations.length} herders
        </div>
      </div>

      {(userRole === 'admin' || userRole === 'farmer') && (
        <div style={{ marginBottom: '10px' }}>
          <label>
            <input
              type="radio"
              value="grazing"
              checked={drawType === 'grazing'}
              onChange={() => setDrawType('grazing')}
              disabled={isOffline}
            />
            Grazing Area
          </label>{' '}
          <label>
            <input
              type="radio"
              value="non-grazing"
              checked={drawType === 'non-grazing'}
              onChange={() => setDrawType('non-grazing')}
              disabled={isOffline}
            />
            Non-Grazing Area
          </label>
          {isOffline && (
            <span style={{ color: 'orange', fontSize: '12px', marginLeft: '10px' }}>
              (Drawing disabled in offline mode)
            </span>
          )}
        </div>
      )}

      <MapContainer center={mapCenter} zoom={6} style={{ height: '600px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* User's current location */}
        {userLocation && (
          <Marker position={userLocation}>
            <Popup>
              <div>
                <strong>Your Location (Farmer)</strong><br/>
                Lat: {userLocation[0].toFixed(4)}<br/>
                Lon: {userLocation[1].toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Cow/Livestock markers */}
        {cowMarkers.map((cow, idx) => {
          if (cow.lat == null || cow.lon == null) return null;
          return (
            <Marker key={`cow-${idx}`} position={[cow.lat, cow.lon]} icon={cowIcon}>
              <Popup>
                <div>
                  <strong>🐄 Livestock {idx + 1}</strong><br/>
                  Lat: {cow.lat.toFixed(4)}<br/>
                  Lon: {cow.lon.toFixed(4)}<br/>
                  Last Update: {getTimeSinceUpdate(cow.lastUpdate)}<br/>
                  {cow.accuracy && <span>Accuracy: {cow.accuracy.toFixed(0)}m</span>}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Herder location markers */}
        {herderLocations.map((herder, idx) => {
          if (herder.lat == null || herder.lon == null) return null;
          return (
            <Marker key={`herder-${idx}`} position={[herder.lat, herder.lon]} icon={herderIcon}>
              <Popup>
                <div>
                  <strong>👨‍🌾 Herder {herder.userId || herder.id}</strong><br/>
                  Lat: {herder.lat.toFixed(4)}<br/>
                  Lon: {herder.lon.toFixed(4)}<br/>
                  Last Update: {getTimeSinceUpdate(herder.lastUpdate)}<br/>
                  {herder.accuracy && <span>Accuracy: {herder.accuracy.toFixed(0)}m<br/></span>}
                  Status: {herder.isOffline ? '🔴 Offline' : '🟢 Online'}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Grazing areas */}
        {grazingAreas.map(({ id, coords }) => (
          <Polygon
            key={id}
            positions={coords.map((pt) => [pt.lat, pt.lng])}
            pathOptions={{ color: 'green', fillOpacity: 0.2 }}
          />
        ))}

        {/* Non-grazing areas */}
        {nonGrazingAreas.map(({ id, coords }) => (
          <Polygon
            key={id}
            positions={coords.map((pt) => [pt.lat, pt.lng])}
            pathOptions={{ color: 'red', fillOpacity: 0.3 }}
          />
        ))}

        {/* Draw controls for admin/farmer */}
        {(userRole === 'admin' || userRole === 'farmer') && !isOffline && (
          <DrawControl
            drawType={drawType}
            onCreated={handleCreated}
            onDeleted={handleDeleted}
          />
        )}
      </MapContainer>

      {/* Status information */}
      <div style={{ marginTop: '15px' }}>
        <h4>Tracking Status</h4>
        <div style={{ fontSize: '14px' }}>
          <div>📱 Herders Online: {herderLocations.filter(h => !h.isOffline).length}</div>
          <div>📴 Herders Offline: {herderLocations.filter(h => h.isOffline).length}</div>
          <div>🐄 Livestock Tracked: {cowMarkers.length}</div>
          <div>🟢 Grazing Areas: {grazingAreas.length}</div>
          <div>🔴 Restricted Areas: {nonGrazingAreas.length}</div>
        </div>
      </div>

      {/* Offline mode information */}
      {isOffline && (
        <div style={{ 
          marginTop: '15px',
          padding: '15px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '8px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>📴 Offline Mode Active</h4>
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#856404' }}>
            <li>Showing last known positions from cache</li>
            <li>Cannot create or delete areas while offline</li>
            <li>Herder locations will update when they come back online</li>
            <li>Enable "Show offline herder positions" to see locally cached positions</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default GeoTracker;
