import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { NotificationContext } from '../context/NotificationContext';
import { toast } from 'react-toastify';
import { History } from 'lucide-react';
import { MapPin, Clock, CheckCircle, Package, Send, AlertCircle, Settings, Map as MapIcon, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UpdateLocationModal from '../components/UpdateLocationModal';
import MapComponent from '../components/MapComponent';
import RequestTimeline from '../components/RequestTimeline';

const HospitalDashboard = () => {
  const { api, user } = useContext(AuthContext);
  const { socket } = useContext(NotificationContext);
  const [requests, setRequests] = useState([]);

  const [bloodGroup, setBloodGroup] = useState('A+');
  const [units, setUnits] = useState(1);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchRequests();
    }

  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('request_accepted', (data) => {
        toast.info(`Blood Bank accepted your request!`);
        fetchRequests();
      });

      socket.on('status_updated', (data) => {
        toast.info(`Request status updated: ${data.status}`);
        fetchRequests();
      });

      socket.on('stock_available', (data) => {
        toast.info(`${data.bloodBankName} has stock available! (${data.distance}km away)`);
        fetchRequests();
      });
    }
    return () => {
      if (socket) {
        socket.off('request_accepted');
        socket.off('status_updated');
        socket.off('stock_available');
      }
    };
  }, [socket]);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests/hospital');
      setRequests(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load requests');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setIsRequesting(true);
    try {
      const res = await api.post('/requests', { bloodGroup, units });
      toast.success(`Request sent to ${res.data.targetsFound} nearby blood banks!`);
      setBloodGroup('A+');
      setUnits(1);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create request');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleAcceptBank = async (requestId, bankId) => {
    try {
      await api.put(`/requests/${requestId}/accept/${bankId}`);
      toast.success('Blood bank locked! Resources will be deployed soon.');
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to lock blood bank');
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const activeRequests = requests.filter(r => r.status === 'accepted' || r.status === 'on_the_way');
  const historyRequests = requests.filter(r => r.status === 'delivered');

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded">Broadcasting</span>;
      case 'accepted': return <span className="px-2 py-1 bg-blue-100 text-blue-600 text-[10px] font-bold uppercase rounded">Accepted</span>;
      case 'on_the_way': return <span className="px-2 py-1 bg-yellow-100 text-yellow-600 text-[10px] font-bold uppercase rounded">On the Way</span>;
      case 'delivered': return <span className="px-2 py-1 bg-green-100 text-green-600 text-[10px] font-bold uppercase rounded">Delivered</span>;
      default: return null;
    }
  };

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
          <p className="text-sm text-light/70">Your account is pending verification by an Admin. Emergency broadcasts are restricted.</p>
        </div>
      )}
      <header className="glass-panel p-8 rounded-3xl shadow-2xl border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-50" />
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-3xl font-black text-light tracking-tighter">{user?.name}</h1>
          <p className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mt-1">Hospital Command Center</p>
        </div>
        <div className="flex items-center space-x-6 relative z-10">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsLocationModalOpen(true)}
            className="p-3 bg-white/5 text-light/40 hover:text-primary hover:bg-white/10 rounded-2xl transition-all border border-white/10"
            title="Update Location"
          >
            <Settings size={22} />
          </motion.button>
          <div className="flex items-center space-x-8 px-6 py-2 bg-white/5 rounded-2xl border border-white/10">
            <div className="text-center">
              <p className="text-[10px] font-black text-light/40 uppercase tracking-widest mb-1">Active</p>
              <p className="text-2xl font-black text-primary drop-shadow-[0_0_8px_rgba(255,59,59,0.3)]">{activeRequests.length + pendingRequests.length}</p>
            </div>
            <div className="w-[1px] h-10 bg-white/10"></div>
            <div className="text-center">
              <p className="text-[10px] font-black text-light/40 uppercase tracking-widest mb-1">Total</p>
              <p className="text-2xl font-black text-light/90">{requests.length}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-8 rounded-3xl shadow-xl border-white/5 sticky top-24 preserve-3d">
            <h2 className="text-xl font-black mb-8 flex items-center text-primary tracking-tight">
              <Send size={20} className="mr-3" /> New Request
            </h2>
            <form onSubmit={handleCreateRequest} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-light/40 uppercase tracking-[0.2em] ml-1">Blood Group</label>
                <select value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-black focus:ring-2 focus:ring-primary/50 appearance-none cursor-pointer text-light">
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg} className="bg-dark text-light">{bg}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-light/40 uppercase tracking-[0.2em] ml-1">Units Needed</label>
                <input type="number" min="1" max="50" required value={units} onChange={e => setUnits(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-black focus:ring-2 focus:ring-primary/50 text-light" />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isRequesting || !user?.isVerified}
                className={`w-full py-4 rounded-2xl text-xs font-black text-white shadow-xl transition-all ${(isRequesting || !user?.isVerified) ? 'bg-white/10 text-light/20 cursor-not-allowed' : 'bg-primary hover:bg-red-600 shadow-primary/20'}`}
              >
                {!user?.isVerified ? 'VERIFICATION PENDING' : (isRequesting ? 'SEARCHING NETWORK...' : 'INITIATE EMERGENCY')}
              </motion.button>
            </form>
          </div>

          {/* Map Section */}
          <div className="glass-panel p-4 rounded-3xl shadow-xl border-white/5 h-[320px] overflow-hidden">
            <div className="flex justify-between items-center mb-4 px-4 pt-2">
              <h3 className="text-[10px] font-black text-light/30 uppercase tracking-[0.2em] flex items-center">
                <MapIcon size={14} className="mr-2 text-secondary" /> Network Map
              </h3>
            </div>
            <div className="h-full rounded-2xl overflow-hidden">
              <MapComponent />
            </div>
          </div>
        </div>

        {/* Right Column: Dashboard */}
        <div className="lg:col-span-3 space-y-8">

          {/* Active Sessions */}
          <section>
            <h3 className="text-[10px] font-black text-light/30 uppercase tracking-[0.3em] mb-6 flex items-center ml-2">
              <AlertCircle size={14} className="mr-2 text-primary animate-pulse" /> Active Emergency Sessions
            </h3>
            {(pendingRequests.length + activeRequests.length) === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel p-16 rounded-[40px] border border-dashed border-white/10 text-center"
              >
                <Package className="mx-auto mb-6 text-light/10" size={64} />
                <p className="text-light/30 font-bold tracking-tight text-lg">System idle. No active broadcasts.</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...pendingRequests, ...activeRequests].map(req => (
                  <motion.div
                    layout
                    key={req._id}
                    className="glass-card p-6 rounded-3xl shadow-xl relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center text-primary font-black text-2xl drop-shadow-[0_0_10px_rgba(255,59,59,0.3)] border border-primary/30">
                          {req.bloodGroup}
                        </div>
                        <div>
                          <p className="text-lg font-black text-light">{req.units} Units</p>
                          <p className="text-[10px] font-bold text-light/40 uppercase tracking-widest">{new Date(req.createdAt).toLocaleTimeString()}</p>
                        </div>
                      </div>
                      {getStatusBadge(req.status)}
                    </div>

                    {req.status === 'pending' ? (
                      <div className="space-y-4">
                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 shadow-inner">
                          <motion.div
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="h-full bg-primary w-1/3 rounded-full shadow-[0_0_10px_rgba(255,59,59,0.5)]"
                          ></motion.div>
                        </div>
                        <p className="text-[10px] font-bold text-primary flex items-center italic tracking-wider uppercase">
                          <Clock size={14} className="mr-2 animate-spin" /> Broadcasting to verified banks...
                        </p>

                        {/* List stock available responses */}
                        {req.responses && req.responses.length > 0 && (
                          <div className="mt-4 border-t border-white/5 pt-4 space-y-3">
                            <h4 className="text-[10px] font-black text-light/50 uppercase tracking-[0.2em] mb-2">Available Providers</h4>
                            {req.responses.map(resp => (
                              <div key={resp._id || resp.bloodBank._id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                                <div>
                                  <p className="text-sm font-black text-light/90">{resp.bloodBank.name || 'Blood Bank'}</p>
                                  <p className="text-[10px] text-light/40 font-bold uppercase tracking-widest">{resp.distance} KM AWAY</p>
                                </div>
                                <button
                                  onClick={() => handleAcceptBank(req._id, resp.bloodBank._id || resp.bloodBank)}
                                  disabled={!user?.isVerified}
                                  className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-colors shadow-xl ${!user?.isVerified ? 'bg-white/10 text-light/20 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20'}`}
                                >
                                  ACCEPT
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4 pt-3 border-t border-gray-50">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-gray-400 uppercase">Provider</p>
                          <p className="text-xs font-black text-gray-800">{req.acceptedBy?.name}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`h-1 flex-1 rounded-full ${req.status === 'accepted' || req.status === 'on_the_way' ? 'bg-blue-500' : 'bg-gray-100'}`}></div>
                          <div className={`h-1 flex-1 rounded-full ${req.status === 'on_the_way' ? 'bg-yellow-500' : 'bg-gray-100'}`}></div>
                          <div className="h-1 flex-1 bg-gray-100 rounded-full"></div>
                        </div>
                        <p className="text-[11px] font-bold text-blue-600 flex items-center">
                          <CheckCircle size={12} className="mr-1" /> {req.status === 'accepted' ? 'Preparing for dispatch' : 'Courier is on the way'}
                        </p>
                        <div className="mt-4">
                          <RequestTimeline request={req} />
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* History */}
          <section>
            <h3 className="text-[10px] font-black text-light/30 uppercase tracking-[0.3em] mb-6 flex items-center ml-2">
              <History size={14} className="mr-2 text-success" /> Mission History
            </h3>
            {historyRequests.length === 0 ? (
              <p className="text-sm text-light/20 italic ml-2">No completed missions yet</p>
            ) : (
              <div className="glass-panel rounded-[32px] shadow-2xl border-white/5 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white/5 text-[10px] font-black text-light/40 uppercase tracking-[0.2em] border-b border-white/10">
                      <th className="px-6 py-5">Asset Class</th>
                      <th className="px-6 py-5">Provider</th>
                      <th className="px-6 py-5 min-w-[120px]">Timeline</th>
                      <th className="px-6 py-5">Duration</th>
                      <th className="px-6 py-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {historyRequests.map(req => {
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
                              <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center text-success font-black border border-success/20">
                                {req.bloodGroup}
                              </div>
                              <span className="font-black text-light/90">{req.units} Units</span>
                            </div>
                          </td>
                          <td className="px-6 py-6 font-bold text-light/60 group-hover:text-light/90 transition-colors">
                            {req.acceptedBy?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-6 text-[10px] font-bold text-light/50 tracking-widest space-y-1">
                            <p><span className="text-light/20">REQ:</span> {createT}</p>
                            <p><span className="text-light/20">ACC:</span> {acceptT}</p>
                            <p><span className="text-success/80">DEL:</span> {deliverT}</p>
                          </td>
                          <td className="px-6 py-6">
                            <span className="text-xs font-black text-light/40 flex items-center">
                              <Clock size={12} className="mr-1 text-primary" /> {displayTime}
                            </span>
                          </td>
                          <td className="px-6 py-6 text-right">
                            <span className="text-success font-black text-[10px] tracking-widest uppercase flex items-center justify-end gap-2 drop-shadow-[0_0_10px_rgba(0,230,118,0.2)]">
                              <CheckCircle size={14} /> Delivered
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



export default HospitalDashboard;
