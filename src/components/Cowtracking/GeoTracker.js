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
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const db = getFirestore(app);

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

const GeoTracker = ({ userRole }) => {
  const [cowMarkers, setCowMarkers] = useState([]);
  const [grazingAreas, setGrazingAreas] = useState([]);
  const [nonGrazingAreas, setNonGrazingAreas] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [drawType, setDrawType] = useState('grazing');

  useEffect(() => {
    const q = query(collection(db, 'areas'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const grazing = [],
        nonGrazing = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.type === 'grazing') grazing.push({ id: doc.id, coords: data.coordinates });
        else if (data.type === 'non-grazing') nonGrazing.push({ id: doc.id, coords: data.coordinates });
      });
      setGrazingAreas(grazing);
      setNonGrazingAreas(nonGrazing);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation([pos.coords.latitude, pos.coords.longitude]),
      (err) => console.error("Error getting user location:", err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'cowLocations'), (snapshot) => {
      const cows = snapshot.docs.map((doc) => doc.data());
      setCowMarkers(cows);
    });
    return () => unsub();
  }, []);

  const handleCreated = async (latlngs) => {
    try {
      await addDoc(collection(db, 'areas'), {
        type: drawType,
        coordinates: latlngs,
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
            await deleteDoc(doc(db, 'areas', area.id));
            break;
          } catch (err) {
            console.error("Error deleting polygon:", err);
          }
        }
      }
    }
  };

  const mapCenter =
    userLocation || (cowMarkers[0]?.lat && cowMarkers[0]?.lon
      ? [cowMarkers[0].lat, cowMarkers[0].lon]
      : [9.0820, 8.6753]);

  return (
    <div>
      <h2>Track Cow & Your Location</h2>

      {(userRole === 'admin' || userRole === 'farmer') && (
        <div style={{ marginBottom: '10px' }}>
          <label>
            <input
              type="radio"
              value="grazing"
              checked={drawType === 'grazing'}
              onChange={() => setDrawType('grazing')}
            />
            Grazing Area
          </label>{' '}
          <label>
            <input
              type="radio"
              value="non-grazing"
              checked={drawType === 'non-grazing'}
              onChange={() => setDrawType('non-grazing')}
            />
            Non-Grazing Area
          </label>
        </div>
      )}

      <MapContainer center={mapCenter} zoom={6} style={{ height: '600px', width: '100%' }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {userLocation && (
          <Marker position={userLocation}>
            <Popup>
              {userRole} Location: {userLocation[0].toFixed(4)}, {userLocation[1].toFixed(4)}
            </Popup>
          </Marker>
        )}

        {cowMarkers.map((cow, idx) => {
          if (cow.lat == null || cow.lon == null) {
            console.warn(`Skipping invalid cow marker at index ${idx}:`, cow);
            return null;
          }

          return (
            <Marker key={idx} position={[cow.lat, cow.lon]}>
              <Popup>
                Cow {idx + 1} (Herder): {cow.lat.toFixed(4)}, {cow.lon.toFixed(4)}
              </Popup>
            </Marker>
          );
        })}

        {grazingAreas.map(({ id, coords }) => (
          <Polygon
            key={id}
            positions={coords.map((pt) => [pt.lat, pt.lng])}
            pathOptions={{ color: 'green' }}
          />
        ))}
        {nonGrazingAreas.map(({ id, coords }) => (
          <Polygon
            key={id}
            positions={coords.map((pt) => [pt.lat, pt.lng])}
            pathOptions={{ color: 'red' }}
          />
        ))}

        {(userRole === 'admin' || userRole === 'farmer') && (
          <DrawControl
            drawType={drawType}
            onCreated={handleCreated}
            onDeleted={handleDeleted}
          />
        )}
      </MapContainer>
    </div>
  );
};

export default GeoTracker;
