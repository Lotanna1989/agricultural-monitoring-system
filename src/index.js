import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
// Import the service worker registration file
import * as serviceWorkerRegistration from './serviceWorkerRegistration'; // Use serviceWorkerRegistration

// ✅ Leaflet fix
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Ensure the require paths are correct relative to your project structure
// If you are using Vite or a modern bundler, you might need direct URL imports or aliases
// If require() doesn't work, ensure your bundler (e.g., Webpack configured by CRA) handles it.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode> {/* Added React.StrictMode for development checks */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register(); // ✅ Register the service worker here