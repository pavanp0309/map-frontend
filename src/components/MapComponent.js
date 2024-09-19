import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';
import 'leaflet-routing-machine';
import carIcon from '../assets/carIcon.png'
import mapIcon from '../assets/mapIcon (2).png'


const MapComponent = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [speed, setSpeed] = useState(5); 
  const [coordinates, setCoordinates] = useState([]);
  const [selectedCoordinateIndex, setSelectedCoordinateIndex] = useState(0);

  useEffect(() => {
    const mapInstance = L.map(mapRef.current).setView([28.2380, 83.9956], 11);
    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      // attribution: 'OSM',
      maxZoom: 18,
    }).addTo(mapInstance);

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, []);

  useEffect(() => {
    // Fetch multiple coordinates from the backend
    const fetchCoordinates = async () => {
      try {
        const response = await axios.get('http://localhost:8080/api/coordinates'); 
        setCoordinates(response.data);
      } catch (error) {
        console.error('Error fetching coordinates:', error);
      }
    };

    fetchCoordinates();
  }, []);

  const handleCoordinateChange = (index) => {
    setSelectedCoordinateIndex(index);
    const { start } = coordinates[index];
    if (marker) {
      marker.setLatLng([start.lat, start.lng]);
    } else if (map) {
      const startIcon = L.icon({
        iconUrl: carIcon, // Custom start icon
        iconSize: [50, 50],
      });

      const newMarker = L.marker([start.lat, start.lng], {
        icon: startIcon,
        draggable: false, // Set draggable to false
      }).addTo(map);
      setMarker(newMarker);
    }
  };

//   L.marker({icon:mapIcon}).addTo(map)

  const startMovement = () => {
    if (map && marker && coordinates.length > 0) {
      const { start, end } = coordinates[selectedCoordinateIndex];
      const endIcon = L.icon({
        iconUrl: mapIcon, 
        iconSize: [50, 50],
      });

      L.Routing.control({
        waypoints: [
          L.latLng(start.lat, start.lng),
          L.latLng(end.lat, end.lng),
        ],
      })
        .on('routesfound', (e) => {
          const route = e.routes[0];
          route.coordinates.forEach((coord, index) => {
            setTimeout(() => {
              marker.setLatLng([coord.lat, coord.lng]);
            }, index * 1000 / speed); // Adjust speed based on range slider
          });

          // Set end marker
          L.marker([end.lat, end.lng], {
            icon: endIcon,
            draggable: false,
          }).addTo(map);
        })
        .addTo(map);
    }
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <div id="map" ref={mapRef} style={{ width: '100%', height: '80vh' }}>
      </div>
      <div style={{ padding: '10px', textAlign: 'center' }}>
        <label>Speed: {speed}</label>
        <input
          type="range"
          min="1"
          max="10"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
          style={{ margin: '0 10px' }}
        />
        <select onChange={(e) => handleCoordinateChange(e.target.value)}>
          {coordinates.map((_, index) => (
            <option key={index} value={index}>
              Day {index + 1} history
            </option>
          ))}
        </select>
        <button onClick={startMovement}>Start Movement</button>
      </div>
    </div>
  );
};

export default MapComponent; 
