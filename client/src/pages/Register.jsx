import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from 'react-toastify';
import RegisterMap from '../components/RegisterMap';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Mail, Lock, FileText, Calendar, MapPin, Activity, ArrowRight, MousePointer2 } from 'lucide-react';

// Fix Leaflet's default icon path issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LocationMarker = ({ position, setPosition }) => {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
};

const Register = () => {
  const [role, setRole] = useState('hospital');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [licenseUrl, setLicenseUrl] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [position, setPosition] = useState(null);

  const { register, user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleLocationDetect = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => toast.error("Could not auto-detect. Please click on the map to pin location.")
      );
    }
  };

  useEffect(() => { handleLocationDetect(); }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!position) return toast.error("Please pick your location on the map by clicking it.");

    try {
      await register({
        role, name, email, password, licenseUrl, licenseExpiry,
        latitude: position.lat,
        longitude: position.lng
      });
      navigate('/');
    } catch (err) { }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex-grow flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-6xl w-full perspective-1000">
        <motion.div
          whileHover={{ rotateX: 1, rotateY: 1 }}
          className="glass-panel p-8 md:p-12 rounded-[40px] shadow-3xl flex flex-col lg:flex-row gap-12 preserve-3d overflow-hidden relative"
        >
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -mr-64 -mt-64" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] -ml-64 -mb-64" />

          {/* Left Side: Form */}
          <div className="flex-[1.2] relative z-10">
            <div className="mb-10">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 mb-2"
              >
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity size={24} className="text-primary" />
                </div>
                <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Joining BloodLink</span>
              </motion.div>
              <h2 className="text-5xl font-black text-light tracking-tighter">Create Account</h2>
              <p className="text-light/50 mt-2 font-medium">Equip your facility for emergency response.</p>
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5" onSubmit={onSubmit}>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-light/60 uppercase tracking-widest ml-1">Facility Type</label>
                <select
                  value={role} onChange={e => setRole(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 px-4 text-light focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="hospital" className="bg-dark text-light">hospital</option>
                  <option value="bloodbank" className="bg-dark text-light">blood bank</option>
                  <option value="admin" className="bg-dark text-light">admin</option>
                </select>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-light/60 uppercase tracking-widest ml-1">
                  {role === 'hospital' ? 'Hospital Name' : role === 'bloodbank' ? 'Blood Bank Name' : 'Full Name'}
                </label>
                <div className="relative group">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-light/30 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="text" required value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-light placeholder:text-light/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                    placeholder={role === 'hospital' ? 'City General Hospital' : 'Life Stream Blood Bank'}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-light/60 uppercase tracking-widest ml-1">Email</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-light/30 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-light focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="example@mail.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-light/60 uppercase tracking-widest ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-light/30 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-light focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {role !== 'admin' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-light/60 uppercase tracking-widest ml-1">License URL</label>
                    <div className="relative group">
                      <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-light/30 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="text" required value={licenseUrl} onChange={e => setLicenseUrl(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-light focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-light/60 uppercase tracking-widest ml-1">License Expiry</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-light/30 group-focus-within:text-primary transition-colors" size={18} />
                      <input
                        type="date" required value={licenseExpiry} onChange={e => setLicenseExpiry(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-light [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="md:col-span-2 pt-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl text-md font-black text-white bg-primary hover:bg-red-600 shadow-xl shadow-primary/20 transition-all duration-300"
                >
                  Register <ArrowRight size={20} />
                </motion.button>
              </div>

              <div className="md:col-span-2 text-center mt-2">
                <Link to="/" className="text-sm font-bold text-light/40 hover:text-primary transition-colors">
                  Already registered? <span className="text-primary underline underline-offset-4 font-black">Sign in here</span>
                </Link>
              </div>
            </form>
          </div>

          {/* Right Side: Map */}
          <div className="flex-1 flex flex-col relative z-10">
            <div className="mb-4">
              <label className="text-xs font-bold text-light/60 uppercase tracking-widest ml-1 flex items-center gap-2">
                <MapPin size={14} className="text-primary" /> Pin Facility Location
              </label>
            </div>

            <div className="flex-1 min-h-[400px] border border-white/10 rounded-[32px] overflow-hidden relative group shadow-inner bg-white">
              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/20 to-transparent z-10 pointer-events-none" />

              <RegisterMap position={position} setPosition={setPosition} />
              <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-2">
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  type="button" onClick={handleLocationDetect}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 glass-card rounded-2xl text-xs font-bold text-light hover:bg-white/10 transition-all"
                >
                  <MousePointer2 size={14} /> Use Current GPS
                </motion.button>
                <div className="px-3 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/5 text-[10px] text-light/50 font-medium italic text-center">
                  * Click anywhere on the map to manually adjust coordinates
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
export default Register;
