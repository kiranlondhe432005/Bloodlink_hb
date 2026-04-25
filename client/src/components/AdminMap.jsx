import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

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

const AdminMap = ({ hospitals = [], bloodBanks = [] }) => {
  const verifiedHospitals = hospitals.filter(h => h.isVerified && h.location?.coordinates?.length === 2);
  const verifiedBloodBanks = bloodBanks.filter(b => b.isVerified && b.location?.coordinates?.length === 2);

  const defaultCenter = [20.5937, 78.9629]; // Default center (India roughly)

  return (
    <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 z-0 relative">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ background: "#ffffff", zIndex: 0 }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {verifiedHospitals.map(h => (
          <Marker
            key={h._id}
            position={[h.location.coordinates[1], h.location.coordinates[0]]}
            icon={hospitalIcon}
          >
            <Popup className="premium-popup">
              <div className="p-3 bg-dark/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl">
                <span className="text-[10px] font-black tracking-widest text-red-500 uppercase">Verified Hospital</span>
                <p className="font-bold text-white tracking-tight mt-1">{h.name}</p>
                <p className="text-xs text-light/50">{h.email}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {verifiedBloodBanks.map(b => (
          <Marker
            key={b._id}
            position={[b.location.coordinates[1], b.location.coordinates[0]]}
            icon={bloodBankIcon}
          >
            <Popup className="premium-popup">
              <div className="p-3 bg-dark/90 backdrop-blur-xl rounded-xl border border-white/10 shadow-2xl">
                <span className="text-[10px] font-black tracking-widest text-blue-500 uppercase">Strategic Blood Bank</span>
                <p className="font-bold text-white tracking-tight mt-1">{b.name}</p>
                <p className="text-xs text-light/50">{b.email}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default AdminMap;


