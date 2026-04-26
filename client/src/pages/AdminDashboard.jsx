import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Users, Activity, ShieldCheck, UserPlus, Clock, Map as MapIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MapComponent from '../components/MapComponent';

const AdminDashboard = () => {
  const { api, user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('overview'); // overview, hospitals, bloodbanks, requests, admins

  const [stats, setStats] = useState({ totalHospitals: 0, totalBloodBanks: 0, activeRequests: 0 });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [locationRequests, setLocationRequests] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [bloodBanks, setBloodBanks] = useState([]);
  const [requestsHistory, setRequestsHistory] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    fetchData();
  }, [api]);

  const fetchData = async () => {
    try {
      const promises = [
        api.get('/admin/stats'),
        api.get('/admin/users/pending'),
        api.get('/admin/locations/pending'),
        api.get('/admin/hospitals'),
        api.get('/admin/bloodbanks'),
        api.get('/admin/requests')
      ];

      if (user?.isSuperAdmin) promises.push(api.get('/admin/admins'));

      const results = await Promise.all(promises);

      setStats(results[0].data);
      setPendingUsers(results[1].data);
      setLocationRequests(results[2].data);
      setHospitals(results[3].data);
      setBloodBanks(results[4].data);
      setRequestsHistory(results[5].data);

      if (user?.isSuperAdmin) setAdmins(results[6].data);

    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to fetch admin data');
    }
  };

  const approveUser = async (id) => {
    try {
      await api.put(`/admin/users/${id}/approve`);
      toast.success('User approved successfully');
      fetchData();
    } catch (err) {
      toast.error('Approval failed');
    }
  };

  const rejectUser = async (id) => {
    try {
      await api.delete(`/admin/users/${id}/reject`);
      toast.success('User rejected and removed');
      fetchData();
    } catch (err) {
      toast.error('Rejection failed');
    }
  };

  const resolveLocation = async (id, status) => {
    try {
      // status must strictly be lowercase as per updated schema fixes 'approved' | 'rejected'
      await api.put(`/admin/locations/${id}`, { status: status.toLowerCase() });
      toast.success(`Location request ${status}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to resolve location request');
    }
  };

  const toggleAccess = async (id) => {
    try {
      const res = await api.put(`/admin/users/${id}/toggle-access`);
      toast.success(res.data.message);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle access');
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/create-admin', newAdmin);
      toast.success('New Admin created successfully');
      setNewAdmin({ name: '', email: '', password: '' });
      setShowAddAdmin(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create admin');
    }
  };

  const handleRemoveAdmin = async (id) => {
    if (!window.confirm('Are you sure you want to remove this admin?')) return;
    try {
      await api.delete(`/admin/remove-admin/${id}`);
      toast.success('Admin removed successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove admin');
    }
  };

  const renderUserTable = (users) => (
    <div className="bg-white/5 rounded-xl overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-white/10 uppercase text-xs text-white/50 tracking-wider">
          <tr>
            <th className="p-4">Name</th>
            <th className="p-4">Email</th>
            <th className="p-4">Verification</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {users.map(u => (
            <tr key={u._id} className="hover:bg-white/5 transition-colors">
              <td className="p-4 font-bold">{u.name}</td>
              <td className="p-4 text-white/70">{u.email}</td>
              <td className="p-4">
                <span className={`px-2 py-1 rounded text-xs font-bold ${u.isVerified ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {u.isVerified ? 'Verified' : 'Pending'}
                </span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${u.isActive !== false ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>
                  {u.isActive !== false ? 'Active' : 'Suspended'}
                </span>
              </td>
              <td className="p-4 text-right flex justify-end gap-3 items-center">
                <button
                  onClick={() => toggleAccess(u._id)}
                  className={`px-3 py-1.5 rounded text-[10px] uppercase tracking-widest font-black transition-colors ${u.isActive !== false ? 'bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30' : 'bg-green-500/20 hover:bg-green-500 text-green-500 hover:text-white border border-green-500/30'}`}
                >
                  {u.isActive !== false ? 'Stop Access' : 'Enable Access'}
                </button>
                {u.licenseUrl && (
                  <a href={u.licenseUrl} target="_blank" rel="noreferrer" className="text-secondary text-xs font-bold hover:underline whitespace-nowrap">
                    View License
                  </a>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && <p className="p-6 text-center text-white/50">No records found.</p>}
    </div>
  );

  const renderRequestsTable = () => (
    <div className="bg-white/5 rounded-xl overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-white/10 uppercase text-xs text-white/50 tracking-wider">
          <tr>
            <th className="p-4">Hospital</th>
            <th className="p-4">Blood Bank</th>
            <th className="p-4">Group/Units</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {requestsHistory.map(req => (
            <tr key={req._id} className="hover:bg-white/5 transition-colors">
              <td className="p-4 font-bold">{req.hospital?.name || 'Unknown'}</td>
              <td className="p-4">{req.acceptedBy?.name || 'Unassigned'}</td>
              <td className="p-4 font-bold text-primary">{req.bloodGroup} <span className="text-white/50 text-sm ml-1">({req.units}u)</span></td>
              <td className="p-4">
                <span className="px-2 py-1 rounded text-xs font-bold bg-white/10 text-white/80 uppercase">
                  {req.status.replace('_', ' ')}
                </span>
              </td>
              <td className="p-4 text-right text-sm text-white/50">
                {new Date(req.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {requestsHistory.length === 0 && <p className="p-6 text-center text-white/50">No requests found.</p>}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-7xl mx-auto space-y-8 pb-10"
    >
      <header className="glass-panel p-8 rounded-3xl shadow-2xl border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary opacity-50" />
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-3xl font-black text-light tracking-tighter">System Control</h1>
        </div>

        {user?.isSuperAdmin && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddAdmin(!showAddAdmin)}
            className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center"
          >
            <UserPlus size={20} className="mr-2" />
            {showAddAdmin ? 'CANCEL' : 'ADD ADMIN'}
          </motion.button>
        )}
      </header>

      <AnimatePresence>
        {showAddAdmin && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleCreateAdmin} className="grid md:grid-cols-3 gap-4 p-6 bg-white/5 rounded-2xl">
              <input type="text" placeholder="Name" required value={newAdmin.name}
                onChange={e => setNewAdmin({ ...newAdmin, name: e.target.value })}
                className="p-3 rounded bg-white/10 text-white" />

              <input type="email" placeholder="Email" required value={newAdmin.email}
                onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
                className="p-3 rounded bg-white/10 text-white" />

              <input type="password" placeholder="Password" required value={newAdmin.password}
                onChange={e => setNewAdmin({ ...newAdmin, password: e.target.value })}
                className="p-3 rounded bg-white/10 text-white" />

              <button type="submit" className="col-span-3 bg-primary hover:bg-red-600 transition-colors py-3 rounded text-white font-bold">
                Create Admin
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TABS */}
      <div className="flex gap-4 overflow-x-auto pb-2 border-b border-white/10">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'hospitals', label: 'Hospitals', icon: Users },
          { id: 'bloodbanks', label: 'Blood Banks', icon: ShieldCheck },
          { id: 'requests', label: 'Request History', icon: Clock },
          ...(user?.isSuperAdmin ? [{ id: 'admins', label: 'System Admins', icon: ShieldCheck }] : [])
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-t-xl font-bold transition-all ${activeTab === tab.id
                ? 'bg-white/10 text-white border-b-2 border-primary'
                : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Users, label: 'Verified Hospitals', value: stats.totalHospitals },
              { icon: Activity, label: 'Verified Blood Banks', value: stats.totalBloodBanks },
              { icon: ShieldCheck, label: 'Active Requests', value: stats.activeRequests }
            ].map((stat, i) => (
              <div key={i} className="p-6 bg-white/5 rounded-xl border border-white/5 flex items-center gap-4">
                <div className="p-4 bg-primary/20 rounded-lg text-primary">
                  <stat.icon size={24} />
                </div>
                <div>
                  <p className="text-white/50 text-sm font-bold uppercase">{stat.label}</p>
                  <h2 className="text-3xl font-black">{stat.value}</h2>
                </div>
              </div>
            ))}
          </div>

          {/* Admin Map Section */}
          <div className="glass-panel p-6 rounded-2xl border-white/5 shadow-2xl relative overflow-hidden">
            <h2 className="text-xl font-black mb-6 flex items-center">
              <MapIcon size={20} className="mr-3 text-secondary" /> National Registration Grid
            </h2>
            <div className="h-[450px] rounded-3xl overflow-hidden relative border border-white/10">
              <MapComponent />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Pending Users */}
            <div className="glass-panel p-6 rounded-2xl border-white/5">
              <h2 className="text-xl font-black mb-6 flex items-center justify-between">
                Pending Verifications
                <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">{pendingUsers.length}</span>
              </h2>

              {pendingUsers.length === 0 ? (
                <p className="text-white/50 italic text-sm">No pending facilities to approve.</p>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map(user => (
                    <div key={user._id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white/5 p-4 rounded-xl gap-4">
                      <div>
                        <p className="font-bold flex items-center">
                          {user.name}
                          <span className="ml-2 bg-white/10 text-white/70 text-[10px] uppercase px-2 py-0.5 rounded tracking-widest">{user.role}</span>
                        </p>
                        <p className="text-sm text-gray-400 mb-1">{user.email}</p>
                        {user.licenseUrl && (
                          <a href={user.licenseUrl} target="_blank" rel="noreferrer" className="text-secondary hover:text-white transition-colors text-xs font-bold underline">
                            View License (Expires: {new Date(user.licenseExpiry).toLocaleDateString()})
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveUser(user._id)}
                          className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white transition-colors px-4 py-2 rounded-lg text-sm font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => rejectUser(user._id)}
                          className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors px-4 py-2 rounded-lg text-sm font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Location Requests */}
            <div className="glass-panel p-6 rounded-2xl border-white/5">
              <h2 className="text-xl font-black mb-6 flex items-center justify-between">
                Location Updates
                <span className="bg-secondary text-white text-xs px-2 py-1 rounded-full">{locationRequests.length}</span>
              </h2>

              {locationRequests.length === 0 ? (
                <p className="text-white/50 italic text-sm">No pending location change requests.</p>
              ) : (
                <div className="space-y-4">
                  {locationRequests.map(req => (
                    <div key={req._id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-white/5 p-4 rounded-xl gap-4">
                      <div>
                        <p className="font-bold">{req.user?.name}</p>
                        <p className="text-xs text-white/50">Requested new geo-coordinates.</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => resolveLocation(req._id, 'approved')}
                          className="bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-white px-4 py-2 rounded-lg text-sm font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => resolveLocation(req._id, 'rejected')}
                          className="bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-lg text-sm font-bold"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'hospitals' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-2xl font-black mb-4 group-title">Registered Hospitals</h2>
          {renderUserTable(hospitals)}
        </motion.div>
      )}

      {activeTab === 'bloodbanks' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-2xl font-black mb-4 group-title">Registered Blood Banks</h2>
          {renderUserTable(bloodBanks)}
        </motion.div>
      )}

      {activeTab === 'requests' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-2xl font-black mb-4 group-title">System Request History</h2>
          {renderRequestsTable()}
        </motion.div>
      )}

      {activeTab === 'admins' && user?.isSuperAdmin && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h2 className="text-2xl font-black mb-4 group-title">System Administrators</h2>
          <div className="bg-white/5 rounded-xl overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/10 uppercase text-xs text-white/50 tracking-wider">
                <tr>
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {admins.map(adm => (
                  <tr key={adm._id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold">{adm.name}</td>
                    <td className="p-4 text-white/70">{adm.email}</td>
                    <td className="p-4">
                      {adm.isSuperAdmin ? (
                        <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">Super Admin</span>
                      ) : (
                        <span className="bg-white/10 text-white/70 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">Admin</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {!adm.isSuperAdmin && (
                        <button
                          onClick={() => handleRemoveAdmin(adm._id)}
                          className="px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-colors bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdminDashboard;
