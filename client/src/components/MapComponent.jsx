import React, { useEffect, useState, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { AuthContext } from '../context/AuthContext';
import { MapPin, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

// Custom icons
const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const bloodBankIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapComponent = () => {
  const { api, user } = useContext(AuthContext);
  const [verifiedUsers, setVerifiedUsers] = useState([]);
  const [centerPos, setCenterPos] = useState(null);

  useEffect(() => {
    if (user) {
      if (user.role !== 'admin' && user.location?.coordinates) {
        setCenterPos([user.location.coordinates[1], user.location.coordinates[0]]);
      } else {
        setCenterPos([20.5937, 78.9629]); // Default India center
      }
      fetchVerifiedUsers();
    }
  }, [user]);

  const fetchVerifiedUsers = async () => {
    try {
      const res = await api.get('/users/verified');
      setVerifiedUsers(res.data);
    } catch (err) {
      console.error('Failed to fetch verified users map data:', err);
    }
  };

  if (!centerPos) return (
    <div className="h-full w-full bg-white/5 animate-pulse rounded-[32px] flex flex-col items-center justify-center text-light/20 border border-white/5 space-y-4">
      <div className="w-12 h-12 bg-white/10 rounded-2xl animate-spin shadow-[0_0_15px_rgba(255,255,255,0.1)]"></div>
      <p className="font-black text-[10px] uppercase tracking-[0.3em]">Synching Satellites...</p>
    </div>
  );

  return (
    <div className="h-full w-full rounded-[32px] overflow-hidden shadow-2xl border border-white/10 z-0 group">
      <MapContainer
        center={centerPos}
        zoom={user?.role === 'admin' ? 5 : 13}
        scrollWheelZoom={false}
        className="h-full w-full"
        style={{ background: "#ffffff", minHeight: "300px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {/* Current User Base (Only if not Admin) */}
        {user?.role !== 'admin' && (
          <>
            <Marker position={centerPos} icon={userIcon}>
              <Popup className="premium-popup">
                <div className="p-4 bg-dark/90 backdrop-blur-xl rounded-2xl border border-white/10">
                  <p className="font-black text-white text-sm leading-tight italic tracking-tight">Operational Base</p>
                  <p className="text-[10px] text-light/40 uppercase font-black tracking-widest mt-1">{user.name}</p>
                </div>
              </Popup>
            </Marker>

            <Circle
              center={centerPos}
              radius={5000}
              pathOptions={{
                color: '#ff3b3b',
                fillColor: '#ff3b3b',
                fillOpacity: 0.1,
                weight: 1,
                dashArray: '10, 10'
              }}
            />
          </>
        )}

        {/* Verified Network Users */}
        {verifiedUsers.filter(u => u._id !== user?._id).map(n => {
          if (!n.location?.coordinates) return null;
          return (
            <Marker
              key={n._id}
              position={[n.location.coordinates[1], n.location.coordinates[0]]}
              icon={n.role?.toLowerCase() === 'hospital' ? hospitalIcon : bloodBankIcon}
            >
              <Popup className="premium-popup">
                <div className="w-56 p-4 bg-dark/90 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full border ${n.role?.toLowerCase() === 'hospital' ? 'bg-primary/20 text-primary border-primary/30' : 'bg-secondary/20 text-secondary border-secondary/30'}`}>
                      {n.role?.toLowerCase() === 'hospital' ? 'Verified Hospital' : 'Strategic Blood Bank'}
                    </span>
                  </div>
                  <p className="font-black text-white text-lg mb-2 tracking-tight italic">{n.name}</p>
                  <div className="space-y-2 mb-6">
                    <p className="text-[11px] text-light/40 font-bold flex items-center tracking-wide">
                      <MapPin size={14} className="mr-2 text-primary" /> Regional Partner
                    </p>
                    {n.role?.toLowerCase() === 'bloodbank' && (
                      <p className="text-[11px] text-secondary font-black flex items-center tracking-wide">
                        <Activity size={14} className="mr-2" /> ACTIVE INVENTORY
                      </p>
                    )}
                  </div>
                  {user?.role !== 'admin' && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-3 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black rounded-xl border border-white/10 transition-all tracking-[0.2em]"
                    >
                      ESTABLISH CONTACT
                    </motion.button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

// Map Fix inside component to ensure Leaflet renders correctly
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default MapComponent;
