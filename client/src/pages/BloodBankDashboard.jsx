import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { toast } from 'react-toastify';
import { Bell, CheckCircle, Truck, MapPin, Clock, History, AlertCircle, Settings, Map as MapIcon, ChevronRight, Activity, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UpdateLocationModal from '../components/UpdateLocationModal';
import MapComponent from '../components/MapComponent';
import RequestTimeline from '../components/RequestTimeline';

const BloodBankDashboard = () => {
  const { api, user } = useContext(AuthContext);
  const { socket } = useContext(NotificationContext);
  const [incoming, setIncoming] = useState([]);
  const [accepted, setAccepted] = useState([]);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  
  const [stock, setStock] = useState({
    'A+': 0, 'A-': 0, 'B+': 0, 'B-': 0,
    'O+': 0, 'O-': 0, 'AB+': 0, 'AB-': 0
  });

  useEffect(() => {
    if (user?.bloodStock) {
      setStock(user.bloodStock);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.off('request_received');
      socket.on('request_received', (data) => {
        toast.error(`EMERGENCY: ${data.hospitalName} needs ${data.units} units of ${data.bloodGroup}`, { autoClose: false });
        fetchData();
      });

      socket.off('request_locked');
      socket.on('request_locked', (data) => {
        toast.success(`Hospital accepted your blood stock! Please dispatch immediately.`);
        fetchData();
      });
    }
    return () => {
      if (socket) {
        socket.off('request_received');
        socket.off('request_locked');
      }
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      const [incRes, accRes] = await Promise.all([
        api.get('/requests/incoming'),
        api.get('/requests/bank')
      ]);
      setIncoming(incRes.data);
      setAccepted(accRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load data');
    }
  };

  const handleStockAvailable = async (requestId) => {
    try {
      await api.put(`/requests/${requestId}/stock-available`);
      toast.success('Stock available registered! Waiting for hospital confirmation.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to mark available');
    }
  };

  const handleUpdateStatus = async (requestId, status) => {
    try {
      await api.put(`/requests/${requestId}/status`, { status });
      toast.success(`Status updated to ${status}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const updateStock = async (group, operation) => {
    const currentUnits = stock[group] || 0;
    const newUnits = operation === 'add' ? currentUnits + 1 : Math.max(0, currentUnits - 1);
    
    setStock(prev => ({ ...prev, [group]: newUnits }));

    try {
      await api.put('/users/stock', { group, units: newUnits });
    } catch (err) {
      toast.error(`Failed to update ${group} stock`);
      setStock(prev => ({ ...prev, [group]: currentUnits }));
    }
  };

  const activeSessions = accepted.filter(r => r.status !== 'delivered');
  const pastSessions = accepted.filter(r => r.status === 'delivered');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto space-y-8"
    >
      {!user?.isVerified && (
        <div className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl text-center mb-6">
          <h3 className="text-orange-400 font-bold mb-1 flex items-center justify-center"><AlertCircle size={18} className="mr-2" /> Pending Verification</h3>
          <p className="text-sm text-light/70">Your account is pending verification by an Admin. Broadcast responses are restricted.</p>
        </div>
      )}
      <header className="glass-panel p-8 rounded-3xl shadow-2xl border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary via-primary to-secondary opacity-50" />
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-3xl font-black text-light tracking-tighter">{user?.name}</h1>
          <p className="text-secondary font-black uppercase tracking-[0.3em] text-[10px] mt-1">Provider Control Center</p>
        </div>
        <div className="flex items-center space-x-6 relative z-10">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsLocationModalOpen(true)}
            className="p-3 bg-white/5 text-light/40 hover:text-secondary hover:bg-white/10 rounded-2xl transition-all border border-white/10"
            title="Update Location"
          >
            <Settings size={22} />
          </motion.button>
          <div className="flex items-center space-x-8 px-6 py-2 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-center">
              <p className="text-[10px] font-black text-light/40 uppercase tracking-widest mb-1">Incoming</p>
              <p className="text-2xl font-black text-primary drop-shadow-[0_0_8px_rgba(255,59,59,0.3)]">{incoming.length}</p>
            </div>
            <div className="w-[1px] h-10 bg-white/10"></div>
            <div className="text-center">
              <p className="text-[10px] font-black text-light/40 uppercase tracking-widest mb-1">Active</p>
              <p className="text-2xl font-black text-blue-400 drop-shadow-[0_0_8px_rgba(30,144,255,0.3)]">{activeSessions.length}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Incoming Emergencies */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] flex items-center mb-6 ml-2">
            <Bell size={16} className="mr-3 animate-bounce shadow-primary" /> Priority Broadcasts
          </h3>
          <AnimatePresence mode="popLayout">
            {incoming.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-panel p-12 rounded-[32px] border border-dashed border-white/10 text-center"
              >
                <p className="text-light/20 text-sm font-bold italic">Network quiet. Monitoring...</p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {incoming.map(notif => {
                  const req = notif.bloodRequest;
                  if (!req) return null;
                  return (
                    <motion.div
                      layout
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      key={notif._id}
                      className="glass-card p-6 rounded-[32px] shadow-2xl border-primary/20 hover:border-primary/50 transition-all group overflow-hidden relative"
                    >
                      <div className="absolute top-0 right-0 h-1 w-full bg-primary animate-pulse shadow-[0_0_10px_rgba(255,59,59,0.5)]"></div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center text-primary font-black text-2xl border border-primary/30 drop-shadow-[0_0_8px_rgba(255,59,59,0.3)]">
                            {req.bloodGroup}
                          </div>
                          <div>
                            <p className="text-xl font-black text-light tracking-tight">{req.units} Units</p>
                            <p className="text-[10px] font-bold text-primary italic uppercase tracking-widest mt-1">Ultra Priority</p>
                          </div>
                        </div>
                      </div>

                      <div className="mb-6 bg-white/5 p-4 rounded-2xl border border-white/10 group-hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs font-black text-light/90 tracking-tight">{req.hospital.name}</p>
                        </div>
                        <p className="text-[10px] text-light/30 font-bold flex items-center uppercase tracking-widest"><MapPin size={12} className="mr-2 text-primary" /> Location Locked</p>
                      </div>

                      {(() => {
                        const hasResponded = req.responses?.some(r => 
                          r.bloodBank === user._id || (r.bloodBank && r.bloodBank._id === user._id) || (r.bloodBank && r.bloodBank.toString() === user._id.toString())
                        );

                        if (hasResponded) {
                          return (
                            <div className="w-full py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all shadow-xl bg-green-500/10 text-green-400 border border-green-500/20 text-center flex items-center justify-center">
                              <CheckCircle size={14} className="mr-2" /> WAITING FOR HOSPITAL
                            </div>
                          );
                        }

                        return (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={!user?.isVerified}
                            onClick={() => handleStockAvailable(req._id)}
                            className={`w-full py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all shadow-xl ${!user?.isVerified ? 'bg-white/10 text-light/20 cursor-not-allowed' : 'bg-primary hover:bg-red-600 text-white shadow-primary/20'}`}
                          >
                            {!user?.isVerified ? 'VERIFICATION PENDING' : 'MARK STOCK AVAILABLE'}
                          </motion.button>
                        );
                      })()}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </AnimatePresence>

          {/* Nearby Network Map */}
          <div className="glass-panel p-4 rounded-3xl shadow-xl border-white/5 h-[320px] overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-4 pt-2">
              <h3 className="text-[10px] font-black text-light/30 uppercase tracking-[0.2em] flex items-center">
                <MapIcon size={14} className="mr-2 text-secondary" /> Regional Grid
              </h3>
            </div>
            <div className="h-full rounded-2xl overflow-hidden border border-white/5">
              <MapComponent />
            </div>
          </div>
        </div>

        {/* Right Column: Managed Sessions & Inventory */}
        <div className="lg:col-span-2 space-y-8">
          
          <section>
            <h3 className="text-[10px] font-black text-light/30 uppercase tracking-[0.3em] mb-6 flex items-center ml-2">
              <Activity size={14} className="mr-2 text-primary" /> Live Blood Inventory
            </h3>
            <div className="glass-panel p-6 rounded-[32px] shadow-xl border-white/5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(group => (
                  <div key={group} className="bg-white/5 p-4 rounded-2xl flex flex-col items-center border border-white/5 overflow-hidden relative group hover:bg-white/10 transition-colors">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-red-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="text-2xl font-black text-white">{group}</span>
                    <div className="flex items-center gap-4 mt-4 bg-black/20 rounded-full px-2 py-1 border border-white/5">
                      <button 
                        onClick={() => updateStock(group, 'subtract')}
                        disabled={!user?.isVerified}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition font-bold ${!user?.isVerified ? 'bg-white/5 opacity-50 cursor-not-allowed' : 'bg-white/5 hover:bg-red-500/20 hover:text-red-400'}`}
                      ><Minus size={14} /></button>
                      <span className="font-black w-6 text-center text-primary text-xl drop-shadow-[0_0_8px_rgba(255,59,59,0.3)]">{stock[group] !== undefined ? stock[group] : '-'}</span>
                      <button 
                        onClick={() => updateStock(group, 'add')}
                        disabled={!user?.isVerified}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition font-bold ${!user?.isVerified ? 'bg-white/5 opacity-50 cursor-not-allowed' : 'bg-white/5 hover:bg-green-500/20 hover:text-green-400'}`}
                      ><Plus size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-[10px] font-black text-light/30 uppercase tracking-[0.3em] mb-6 flex items-center ml-2">
              <AlertCircle size={14} className="mr-2 text-blue-400" /> Managed Delivery Sessions
            </h3>
            {activeSessions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel p-16 rounded-[40px] border border-dashed border-white/10 text-center"
              >
                <Truck className="mx-auto mb-6 text-light/10" size={64} />
                <p className="text-light/30 font-bold tracking-tight text-lg">Fleet idle. No active dispatches.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {activeSessions.map(req => (
                  <motion.div
                    layout
                    key={req._id}
                    className="glass-card p-6 rounded-3xl shadow-xl border-white/5 hover:border-blue-500/30 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 font-black text-xl border border-blue-500/30 shadow-[0_0_10px_rgba(30,144,255,0.2)]">
                          {req.bloodGroup}
                        </div>
                        <div>
                          <p className="text-lg font-black text-light tracking-tight">{req.units} Units</p>
                          <p className="text-[10px] font-bold text-light/30 uppercase tracking-widest">{req.hospital.name}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 text-[9px] font-black uppercase rounded-full tracking-widest ${req.status === 'accepted' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'}`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 mt-4 mb-6">
                      <div className="h-1 flex-1 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(30,144,255,0.5)]"></div>
                      <div className={`h-1 flex-1 rounded-full ${req.status === 'on_the_way' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(255,215,0,0.5)]' : 'bg-white/5'}`}></div>
                      <div className="h-1 flex-1 bg-white/5 rounded-full"></div>
                    </div>

                    <div className="mb-8">
                      <RequestTimeline request={req} />
                    </div>

                    <div className="space-y-3">
                      {req.status === 'accepted' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateStatus(req._id, 'on_the_way')}
                          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all flex items-center justify-center shadow-xl shadow-blue-500/20"
                        >
                          <Truck size={16} className="mr-2" /> DISPATCH ORDER
                        </motion.button>
                      )}
                      {req.status === 'on_the_way' && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUpdateStatus(req._id, 'delivered')}
                          className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all flex items-center justify-center shadow-xl shadow-green-500/20"
                        >
                          <CheckCircle size={16} className="mr-2" /> CONFIRM DELIVERY
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-[10px] font-black text-light/30 uppercase tracking-[0.3em] mb-6 flex items-center ml-2">
              <History size={14} className="mr-2 text-primary" /> Fulfilled Missions
            </h3>
            {pastSessions.length === 0 ? (
              <p className="text-sm text-light/20 italic ml-2">No historical data available</p>
            ) : (
              <div className="glass-panel rounded-[32px] shadow-2xl border-white/5 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white/5 text-[10px] font-black text-light/40 uppercase tracking-[0.2em] border-b border-white/10">
                      <th className="px-6 py-5">Inventory</th>
                      <th className="px-6 py-5">Destination</th>
                      <th className="px-6 py-5">Timeline Log</th>
                      <th className="px-6 py-5">Total Duration</th>
                      <th className="px-6 py-5 text-right">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {pastSessions.map(req => {
                      const createT = new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const acceptT = req.acceptedAt ? new Date(req.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                      const deliverT = req.deliveredAt ? new Date(req.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';
                      
                      const tStart = new Date(req.createdAt);
                      const tEnd = new Date(req.deliveredAt || req.updatedAt);
                      const diffMins = Math.max(0, Math.round((tEnd - tStart) / 60000));
                      const hours = Math.floor(diffMins / 60);
                      const displayTime = hours > 0 ? `${hours}h ${diffMins % 60}m` : `${diffMins} mins`;
                      
                      return (
                        <tr key={req._id} className="hover:bg-white/5 transition group">
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-light font-black border border-white/10">
                                {req.bloodGroup}
                              </div>
                              <span className="font-black text-light/90">{req.units} Units</span>
                            </div>
                          </td>
                          <td className="px-6 py-6 font-bold text-light/60 group-hover:text-light/90 transition-colors">
                            {req.hospital?.name}
                          </td>
                          <td className="px-6 py-6 text-[10px] font-bold text-light/50 tracking-widest space-y-1">
                            <p><span className="text-light/20">REQ:</span> {createT}</p>
                            <p><span className="text-light/20">ACC:</span> {acceptT}</p>
                            <p><span className="text-success/80">DEL:</span> {deliverT}</p>
                          </td>
                          <td className="px-6 py-6">
                            <span className="text-xs font-bold text-light/40 flex items-center">
                              <Clock size={12} className="mr-1 text-primary" /> {displayTime}
                            </span>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <span className="text-success font-black text-[10px] tracking-widest uppercase flex items-center justify-end gap-2 drop-shadow-[0_0_10px_rgba(0,230,118,0.2)]">
                              DELIVERED
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

      </div>
      <UpdateLocationModal isOpen={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
    </motion.div>
  );
};

export default BloodBankDashboard;
