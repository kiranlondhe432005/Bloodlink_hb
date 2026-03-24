import React, { useState, useContext } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { X, MapPin, Navigation, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationPicker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
};

const UpdateLocationModal = ({ isOpen, onClose }) => {
  const { api, user } = useContext(AuthContext);
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleAutoDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => {
          console.error(err);
          toast.error("Could not auto-detect location");
        }
      );
    }
  };

  const handleSubmit = async () => {
    if (!position) return toast.error("Please pick a location on the map");
    setLoading(true);
    try {
      await api.post('/users/request-location', {
        latitude: position.lat,
        longitude: position.lng
      });
      toast.success("Location change request submitted!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="glass-panel w-full max-w-2xl rounded-[40px] shadow-3xl overflow-hidden flex flex-col max-h-[90vh] relative z-10 border-white/10"
          >
            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary/20 rounded-2xl flex items-center justify-center text-secondary border border-secondary/30">
                  <MapPin size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-light tracking-tight italic">Relocation Protocol</h2>
                  <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mt-1 flex items-center">
                    <ShieldCheck size={12} className="mr-2" /> Security Clearance Required
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ rotate: 90, scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-3 hover:bg-white/10 text-light/20 hover:text-light rounded-2xl transition-all"
              >
                <X size={24} />
              </motion.button>
            </div>

            <div className="flex-grow p-10 space-y-8 overflow-y-auto custom-scrollbar">
              <div className="h-[350px] w-full rounded-[32px] overflow-hidden relative border border-white/10 shadow-inner group">
                <div className="absolute inset-0 bg-primary/5 pointer-events-none z-10 group-hover:opacity-0 transition-opacity"></div>
                <MapContainer center={[20.5937, 78.9629]} zoom={4} className="h-full w-full">
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationPicker position={position} setPosition={setPosition} />
                </MapContainer>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAutoDetect}
                  className="absolute bottom-6 right-6 z-[1000] bg-white text-dark p-4 rounded-2xl shadow-2xl hover:bg-gray-100 transition-all"
                >
                  <Navigation size={22} className="fill-current" />
                </motion.button>
              </div>

              <motion.div
                animate={position ? { scale: 1.02 } : { scale: 1 }}
                className={`p-6 rounded-3xl border transition-all flex items-start space-x-5 ${position ? 'bg-secondary/10 border-secondary/30 shadow-[0_0_20px_rgba(0,184,212,0.1)]' : 'bg-white/5 border-white/10 underline-offset-4'}`}
              >
                <div className={`p-3 rounded-xl ${position ? 'bg-secondary/20 text-secondary' : 'bg-white/10 text-light/20'}`}>
                  <MapPin size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-light/40 uppercase tracking-widest mb-1">Target Coordinates</p>
                  <p className={`text-lg font-black tracking-tight ${position ? 'text-light' : 'text-light/20 italic'}`}>
                    {position && position.lat && position.lng
                      ? `${Number(position.lat).toFixed(6)}° N , ${Number(position.lng).toFixed(6)}° E`
                      : 'Deployment Vector Offline'}
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="p-8 bg-white/5 border-t border-white/5 flex space-x-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClose}
                className="flex-1 py-4 px-6 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-light/40 hover:text-light hover:bg-white/10 transition-all uppercase tracking-[0.2em]"
              >
                ABORT
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading || !position}
                onClick={handleSubmit}
                className={`flex-[2] py-4 px-6 rounded-2xl text-[10px] font-black text-white transition-all shadow-xl tracking-[0.2em] ${loading || !position ? 'bg-white/5 text-light/10 cursor-not-allowed border border-white/5' : 'bg-secondary hover:bg-[#00c8e0] shadow-secondary/20'}`}
              >
                {loading ? 'TRANSMITTING...' : 'AUTHORIZE RELOCATION'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default UpdateLocationModal;
