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

function pointInPolygon(point, vs) {
  const x = point[0], y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0], yi = vs[i][1];
    const xj = vs[j][0], yj = vs[j][1];
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

  // Listen for polygon updates
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'areas'), (snapshot) => {
      const grazing = [], nonGrazing = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'grazing') grazing.push(data.coordinates);
        else if (data.type === 'non-grazing') nonGrazing.push(data.coordinates);
      });
      setGrazingAreas(grazing);
      setNonGrazingAreas(nonGrazing);
    });
    return () => unsub();
  }, []);

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

      try {
        await addDoc(collection(db, 'cowMovements'), {
          lat, lon, userId, timestamp: new Date(),
        });
        await setDoc(doc(db, 'cowLocations', userId), {
          lat, lon, userId, timestamp: new Date(),
        });
      } catch (err) {
        console.error('Error saving movement:', err);
      }
    },
    [nonGrazingAreas, userId]
  );

  useEffect(() => {
    // Step 1: Get initial accurate position
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        console.log('Initial accurate position:', lat, lon);
        setPosition([lat, lon]);
        await checkGeofence(lat, lon);

        // Step 2: Start watching position continuously
        const watchId = navigator.geolocation.watchPosition(
          async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            console.log('Updated position:', lat, lon);
            setPosition([lat, lon]);
            await checkGeofence(lat, lon);
          },
          (err) => {
            console.error('Geolocation watch error:', err);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );

        // Cleanup on unmount
        return () => navigator.geolocation.clearWatch(watchId);
      },
      (err) => {
        console.error('Initial geolocation error:', err);
        setPosition(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [checkGeofence]);

  return (
    <div>
      <h3>Your Live Location</h3>
      {!position ? (
        <p>Getting your location...</p>
      ) : (
        <MapContainer center={position} zoom={13} style={{ height: '500px', width: '100%' }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <Marker position={position}>
            <Popup>You are here: {position[0].toFixed(5)}, {position[1].toFixed(5)}</Popup>
          </Marker>
          {grazingAreas.map((area, i) => (
            <Polygon key={`g-${i}`} positions={area.map(pt => [pt.lat, pt.lng])} pathOptions={{ color: 'green' }} />
          ))}
          {nonGrazingAreas.map((area, i) => (
            <Polygon key={`ng-${i}`} positions={area.map(pt => [pt.lat, pt.lng])} pathOptions={{ color: 'red' }} />
          ))}
        </MapContainer>
      )}
      <AlarmAndNotifications trigger={alertTriggered} />
    </div>
  );
};

export default GeoTrackerHerder;
