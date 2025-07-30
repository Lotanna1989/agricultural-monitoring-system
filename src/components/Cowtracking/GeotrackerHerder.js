import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getFirestore, collection, addDoc, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { app } from '../../firebase/firebase';
import AlarmAndNotifications from './AlarmAndNotifications';

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

const removeOfflineData = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
};

const getAllOfflineMovements = () => {
  try {
    const movements = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('offline-movement-')) {
        const data = getOfflineData(key);
        if (data) {
          movements.push({ key, data });
        }
      }
    }
    return movements;
  } catch (error) {
    console.error('Error getting offline movements:', error);
    return [];
  }
};

function pointInPolygon(point, vs) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const [xi, yi] = vs[i];
    const [xj, yj] = vs[j];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

const GeoTrackerHerder = ({ userId }) => {
  const [position, setPosition] = useState(null);
  const [grazingAreas, setGrazingAreas] = useState([]);
  const [nonGrazingAreas, setNonGrazingAreas] = useState([]);
  const [alertTriggered, setAlertTriggered] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineData();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync offline data when back online
  const syncOfflineData = async () => {
    if (!isOnline) return;

    try {
      const offlineMovements = getAllOfflineMovements();
      console.log(`Found ${offlineMovements.length} offline movements to sync`);

      for (const { key, data } of offlineMovements) {
        try {
          // Add to cowMovements collection
          await addDoc(collection(db, 'cowMovements'), data);
          
          // Update current location
          await setDoc(doc(db, 'cowLocations', userId), data);
          
          // Remove from offline storage after successful sync
          removeOfflineData(key);
          console.log('Synced offline movement:', data);
        } catch (syncError) {
          console.error('Error syncing movement:', syncError);
          // Keep the data for next sync attempt
        }
      }

      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error during sync:', error);
    }
  };

  // Load grazing & non-grazing areas with offline fallback
  useEffect(() => {
    if (isOnline) {
      const unsub = onSnapshot(
        collection(db, 'areas'), 
        (snapshot) => {
          const grazing = [], nonGrazing = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.type === 'grazing') grazing.push(data.coordinates);
            else if (data.type === 'non-grazing') nonGrazing.push(data.coordinates);
          });
          
          setGrazingAreas(grazing);
          setNonGrazingAreas(nonGrazing);
          
          // Cache for offline use
          saveOfflineData('cached-grazing-areas', grazing);
          saveOfflineData('cached-non-grazing-areas', nonGrazing);
        },
        (error) => {
          console.error('Error fetching areas:', error);
          loadCachedAreas();
        }
      );
      return () => unsub();
    } else {
      loadCachedAreas();
    }
  }, [isOnline]);

  const loadCachedAreas = () => {
    const cachedGrazing = getOfflineData('cached-grazing-areas') || [];
    const cachedNonGrazing = getOfflineData('cached-non-grazing-areas') || [];
    setGrazingAreas(cachedGrazing);
    setNonGrazingAreas(cachedNonGrazing);
  };

  const checkGeofence = useCallback(
    async (lat, lon) => {
      let inRestricted = false;
      nonGrazingAreas.forEach((area) => {
        const polygonCoords = area.map((pt) => [pt.lat, pt.lng]);
        if (pointInPolygon([lat, lon], polygonCoords)) {
          inRestricted = true;
        }
      });
      setAlertTriggered(inRestricted);

      const movement = {
        lat,
        lon,
        userId,
        timestamp: new Date(),
        userType: 'herder', // Add user type for identification
        accuracy: position?.accuracy || null,
      };

      try {
        if (isOnline) {
          await addDoc(collection(db, 'cowMovements'), movement);
          await setDoc(doc(db, 'cowLocations', userId), movement);
          console.log('Movement saved online:', movement);
        } else {
          // Save offline with timestamp-based key for uniqueness
          const key = `offline-movement-${userId}-${Date.now()}`;
          saveOfflineData(key, movement);
          console.log('Movement saved offline:', movement);
          
          // Also update the latest location cache for offline viewing
          saveOfflineData(`latest-location-${userId}`, movement);
        }
      } catch (err) {
        console.error('Error saving movement:', err);
        // Fallback to offline storage if online save fails
        const key = `offline-movement-${userId}-${Date.now()}`;
        saveOfflineData(key, movement);
      }
    },
    [nonGrazingAreas, userId, isOnline, position]
  );

  // GPS tracking with offline support
  useEffect(() => {
    let watchId = null;

    const startTracking = () => {
      // Get initial position
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lon, accuracy } = pos.coords;
          const newPosition = { lat, lon, accuracy };
          setPosition([lat, lon]);
          await checkGeofence(lat, lon);
        },
        (err) => {
          console.error('Initial geolocation error:', err);
          // Try to load last known position from cache
          const lastPosition = getOfflineData(`latest-location-${userId}`);
          if (lastPosition) {
            setPosition([lastPosition.lat, lastPosition.lon]);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000, // Allow cached position up to 10 seconds old
        }
      );

      // Start continuous tracking
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          const { latitude: lat, longitude: lon, accuracy } = pos.coords;
          const newPosition = { lat, lon, accuracy };
          setPosition([lat, lon]);
          await checkGeofence(lat, lon);
        },
        (err) => {
          console.error('Geolocation watch error:', err);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 5000, // More frequent updates when possible
        }
      );
    };

    startTracking();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [checkGeofence, userId]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      syncOfflineData();
    }
  }, [isOnline]);

  const getStatusText = () => {
    if (!isOnline) {
      return "🔴 Offline Mode - Location being tracked locally";
    }
    if (lastSyncTime) {
      return `🟢 Online - Last sync: ${lastSyncTime.toLocaleTimeString()}`;
    }
    return "🟢 Online";
  };

  const getPendingSyncCount = () => {
    return getAllOfflineMovements().length;
  };

  return (
    <div>
      <h3>Your Live Location</h3>
      <div style={{ marginBottom: '10px', fontSize: '14px' }}>
        <div>{getStatusText()}</div>
        {!isOnline && (
          <div style={{ color: 'orange' }}>
            📤 {getPendingSyncCount()} locations pending sync
          </div>
        )}
      </div>

      {!position ? (
        <p>Getting your location...</p>
      ) : (
        <MapContainer center={position} zoom={13} style={{ height: '500px', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={position}>
            <Popup>
              <div>
                <div>You are here:</div>
                <div>Lat: {position[0].toFixed(5)}</div>
                <div>Lon: {position[1].toFixed(5)}</div>
                <div>Status: {isOnline ? 'Online' : 'Offline'}</div>
              </div>
            </Popup>
          </Marker>
          
          {grazingAreas.map((area, i) => (
            <Polygon 
              key={`g-${i}`} 
              positions={area.map(pt => [pt.lat, pt.lng])} 
              pathOptions={{ color: 'green', fillOpacity: 0.2 }} 
            />
          ))}
          
          {nonGrazingAreas.map((area, i) => (
            <Polygon 
              key={`ng-${i}`} 
              positions={area.map(pt => [pt.lat, pt.lng])} 
              pathOptions={{ color: 'red', fillOpacity: 0.3 }} 
            />
          ))}
        </MapContainer>
      )}
      
      <AlarmAndNotifications trigger={alertTriggered} />
      
      {!isOnline && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '4px'
        }}>
          <strong>Offline Mode:</strong> Your location is being tracked and will sync when you're back online.
        </div>
      )}
    </div>
  );
};

export default GeoTrackerHerder;
