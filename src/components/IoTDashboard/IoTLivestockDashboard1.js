import React, { useEffect, useState, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polygon,
  useMap,
  Polyline,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-draw';

// Firebase imports for Realtime Database
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, remove } from 'firebase/database';

// Your new Firebase config for IoT
const iotFirebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com/",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

// Initialize Firebase for IoT
const iotApp = initializeApp(iotFirebaseConfig, 'iot-app');
const iotDb = getDatabase(iotApp);

// Fix Leaflet default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom cow marker icon
const cowIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
      <circle cx="16" cy="16" r="14" fill="#8B4513" stroke="#654321" stroke-width="2"/>
      <circle cx="16" cy="16" r="10" fill="#A0522D"/>
      <text x="16" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="bold">COW</text>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

// Alarm icon for restricted areas
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

const DrawControl = ({ onCreated, onDeleted, drawType }) => {
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

const IoTLivestockDashboard = ({ userRole = 'farmer' }) => {
  const [livestockData, setLivestockData] = useState({});
  const [grazingAreas, setGrazingAreas] = useState([]);
  const [nonGrazingAreas, setNonGrazingAreas] = useState([]);
  const [drawType, setDrawType] = useState('grazing');
  const [alarms, setAlarms] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [movementHistory, setMovementHistory] = useState({});

  // Point-in-polygon algorithm
  const isPointInPolygon = (point, polygon) => {
    const x = point.lat, y = point.lng;
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lat, yi = polygon[i].lng;
      const xj = polygon[j].lat, yj = polygon[j].lng;
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Check geofencing violations
  const checkGeofencing = (animalId, position) => {
    // Check if in non-grazing (restricted) area
    for (const area of nonGrazingAreas) {
      if (isPointInPolygon(position, area.coords)) {
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
        
        return true;
      }
    }
    return false;
  };

  // Listen to IoT livestock data
  useEffect(() => {
    const livestockRef = ref(iotDb, '/');
    const unsubscribe = onValue(livestockRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setLivestockData(data);
        
        // Check geofencing for each animal's latest position
        Object.keys(data).forEach(animalId => {
          if (animalId !== 'latest_position' && data[animalId]?.latest_position) {
            const position = {
              lat: data[animalId].latest_position.latitude,
              lng: data[animalId].latest_position.longitude
            };
            checkGeofencing(animalId, position);
          }
        });
        
        // Also check the global latest_position if it exists
        if (data.latest_position) {
          const position = {
            lat: data.latest_position.latitude,
            lng: data.latest_position.longitude
          };
          checkGeofencing('main_device', position);
        }
      }
    });

    return () => unsubscribe();
  }, [nonGrazingAreas]);

  // Listen to geofencing areas
  useEffect(() => {
    const areasRef = ref(iotDb, 'geofencing_areas');
    const unsubscribe = onValue(areasRef, (snapshot) => {
      if (snapshot.exists()) {
        const areas = snapshot.val();
        const grazing = [], nonGrazing = [];
        
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
      }
    });

    return () => unsubscribe();
  }, []);

  const handleCreated = async (latlngs) => {
    try {
      const areasRef = ref(iotDb, 'geofencing_areas');
      const newAreaRef = push(areasRef);
      await set(newAreaRef, {
        type: drawType,
        coordinates: latlngs,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error saving polygon:", err);
    }
  };

  const handleDeleted = async (layer) => {
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
            const areaRef = ref(iotDb, `geofencing_areas/${area.id}`);
            await remove(areaRef);
            break;
          } catch (err) {
            console.error("Error deleting polygon:", err);
          }
        }
      }
    }
  };

  const dismissAlarm = (alarmId) => {
    setAlarms(prev => prev.filter(alarm => alarm.id !== alarmId));
  };

  // Get map center from livestock data
  const getMapCenter = () => {
    if (livestockData.latest_position) {
      return [livestockData.latest_position.latitude, livestockData.latest_position.longitude];
    }
    
    const animalIds = Object.keys(livestockData).filter(id => id !== 'latest_position');
    if (animalIds.length > 0 && livestockData[animalIds[0]]?.latest_position) {
      const pos = livestockData[animalIds[0]].latest_position;
      return [pos.latitude, pos.longitude];
    }
    
    return [9.0820, 8.6753]; // Default to Nigeria coordinates
  };

  // Get all animal markers
  const getAnimalMarkers = () => {
    const markers = [];
    
    // Main device position
    if (livestockData.latest_position) {
      const pos = livestockData.latest_position;
      const isInRestrictedArea = nonGrazingAreas.some(area => 
        isPointInPolygon({ lat: pos.latitude, lng: pos.longitude }, area.coords)
      );
      
      markers.push({
        id: 'main_device',
        position: [pos.latitude, pos.longitude],
        data: pos,
        isInRestrictedArea,
      });
    }
    
    // Individual animal positions
    Object.keys(livestockData).forEach(animalId => {
      if (animalId !== 'latest_position' && livestockData[animalId]?.latest_position) {
        const pos = livestockData[animalId].latest_position;
        const isInRestrictedArea = nonGrazingAreas.some(area => 
          isPointInPolygon({ lat: pos.latitude, lng: pos.longitude }, area.coords)
        );
        
        markers.push({
          id: animalId,
          position: [pos.latitude, pos.longitude],
          data: pos,
          isInRestrictedArea,
        });
      }
    });
    
    return markers;
  };

  const animalMarkers = getAnimalMarkers();
  const mapCenter = getMapCenter();

  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">IoT Livestock Tracking Dashboard</h1>
        <p className="text-gray-600">Real-time tracking of livestock using IoT wearable devices</p>
      </div>

      {/* Alarms Panel */}
      {alarms.length > 0 && (
        <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 rounded">
          <h3 className="text-lg font-semibold text-red-700 mb-2">🚨 Active Alarms</h3>
          {alarms.map(alarm => (
            <div key={alarm.id} className="flex justify-between items-center mb-2 p-2 bg-red-50 rounded">
              <div>
                <span className="font-medium">{alarm.message}</span>
                <span className="text-sm text-gray-600 ml-2">
                  {new Date(alarm.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <button
                onClick={() => dismissAlarm(alarm.id)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Dismiss
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800">Total Animals</h3>
          <p className="text-2xl font-bold text-blue-900">{animalMarkers.length}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800">Grazing Areas</h3>
          <p className="text-2xl font-bold text-green-900">{grazingAreas.length}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-red-800">Restricted Areas</h3>
          <p className="text-2xl font-bold text-red-900">{nonGrazingAreas.length}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-800">Active Alarms</h3>
          <p className="text-2xl font-bold text-yellow-900">{alarms.length}</p>
        </div>
      </div>

      {/* Controls */}
      {(userRole === 'admin' || userRole === 'farmer') && (
        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Geofencing Controls</h3>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="grazing"
                checked={drawType === 'grazing'}
                onChange={() => setDrawType('grazing')}
                className="mr-2"
              />
              <span className="text-green-700">Grazing Area</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="non-grazing"
                checked={drawType === 'non-grazing'}
                onChange={() => setDrawType('non-grazing')}
                className="mr-2"
              />
              <span className="text-red-700">Restricted Area</span>
            </label>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="mb-6">
        <MapContainer center={mapCenter} zoom={15} style={{ height: '600px', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {/* Animal Markers */}
          {animalMarkers.map((animal) => (
            <Marker
              key={animal.id}
              position={animal.position}
              icon={animal.isInRestrictedArea ? alarmIcon : cowIcon}
            >
              <Popup>
                <div className="p-2">
                  <h4 className="font-bold text-lg mb-2">
                    {animal.id === 'main_device' ? 'Main Device' : `Animal ${animal.id}`}
                  </h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Coordinates:</strong> {animal.data.latitude?.toFixed(6)}, {animal.data.longitude?.toFixed(6)}</p>
                    <p><strong>Altitude:</strong> {animal.data.altitude}m</p>
                    <p><strong>Speed:</strong> {animal.data.speed_kmph} km/h</p>
                    <p><strong>Course:</strong> {animal.data.course}°</p>
                    <p><strong>Satellites:</strong> {animal.data.satellites}</p>
                    <p><strong>HDOP:</strong> {animal.data.hdop}</p>
                    <p><strong>Date:</strong> {animal.data.date}</p>
                    <p><strong>Time:</strong> {animal.data.time}</p>
                    {animal.isInRestrictedArea && (
                      <p className="text-red-600 font-bold">⚠️ IN RESTRICTED AREA!</p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Grazing Areas */}
          {grazingAreas.map(({ id, coords }) => (
            <Polygon
              key={id}
              positions={coords.map((pt) => [pt.lat, pt.lng])}
              pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 0.3 }}
            />
          ))}

          {/* Non-Grazing Areas */}
          {nonGrazingAreas.map(({ id, coords }) => (
            <Polygon
              key={id}
              positions={coords.map((pt) => [pt.lat, pt.lng])}
              pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 0.3 }}
            />
          ))}

          {/* Draw Controls */}
          {(userRole === 'admin' || userRole === 'farmer') && (
            <DrawControl
              drawType={drawType}
              onCreated={handleCreated}
              onDeleted={handleDeleted}
            />
          )}
        </MapContainer>
      </div>

      {/* Live Data Panel */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Live IoT Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {animalMarkers.map(animal => (
            <div key={animal.id} className={`p-3 rounded border ${animal.isInRestrictedArea ? 'bg-red-50 border-red-300' : 'bg-white border-gray-300'}`}>
              <h4 className="font-semibold mb-2">
                {animal.id === 'main_device' ? 'Main Device' : `Animal ${animal.id}`}
                {animal.isInRestrictedArea && <span className="text-red-600 ml-2">🚨</span>}
              </h4>
              <div className="text-sm space-y-1">
                <p>📍 {animal.data.latitude?.toFixed(4)}, {animal.data.longitude?.toFixed(4)}</p>
                <p>🏔️ {animal.data.altitude}m</p>
                <p>🏃 {animal.data.speed_kmph} km/h</p>
                <p>🧭 {animal.data.course}°</p>
                <p>🛰️ {animal.data.satellites} sats</p>
                <p>🕒 {animal.data.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default IoTLivestockDashboard;