import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Activity, Mail, Lock, ArrowRight, FileText, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false); // ✅ added
  
  const [isExpired, setIsExpired] = useState(false);
  const [licenseUrl, setLicenseUrl] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');

  const { login, api } = useContext(AuthContext);
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();


    try {
      setLoading(true); // ✅ start loading

      const data = await login(email, password);

      if (!data) return;

      const role = (data.user?.role || data.role)?.toLowerCase();

      if (role === 'admin') navigate('/admin');
      else if (role === 'hospital') navigate('/hospital');
      else navigate('/bloodbank');

    } catch (error) {
      const message = error?.response?.data?.message || "Login failed";
      
      if (message === 'License expired. Please renew.') {
        setIsExpired(true);
        toast.error(message);
      } else {
        toast.error(message); // ✅ proper error show
      }

    } finally {
      setLoading(false); // ✅ stop loading
    }
  };

  const onRenewSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post('/auth/renew-license', { email, password, licenseUrl, licenseExpiry });
      toast.success('License renewal submitted for verification.');
      setIsExpired(false);
      setLicenseUrl('');
      setLicenseExpiry('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit renewal request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
    > <div className="max-w-md w-full"> <div className="glass-panel p-10 rounded-3xl shadow-2xl relative overflow-hidden">


      <div className="text-center mb-10">
        <Activity size={56} className="mx-auto text-primary" />
        <h2 className="mt-6 text-4xl font-black text-light">BloodLink</h2>
        <p className="mt-2 text-sm text-light/60">Real-time Emergency Blood Logistics</p>
      </div>

      <AnimatePresence mode="wait">
      {!isExpired ? (
        <motion.form 
          key="login"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className="space-y-6" 
          onSubmit={onSubmit}
        >
          <div>
            <label className="text-sm text-light/80">Email Address</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-light/30 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="email"
                autoComplete="email"  // ✅ added
                required
                className="w-full mt-1 p-3 pl-12 rounded bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-light/80">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-light/30 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="password"
                autoComplete="current-password" // ✅ added
                required
                className="w-full mt-1 p-3 pl-12 rounded bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading} // ✅ added
            className="w-full py-3 rounded text-white font-bold transition-all duration-300 bg-primary hover:bg-red-600 shadow-xl shadow-primary/20 flex justify-center items-center"
          >
            {loading ? "Signing in..." : "Sign In"} <ArrowRight size={20} className="ml-2" />
          </button>
        </motion.form>
      ) : (
        <motion.form 
          key="renew"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-6" 
          onSubmit={onRenewSubmit}
        >
          <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl text-center mb-6">
            <h3 className="text-red-400 font-bold mb-1">License Expired</h3>
            <p className="text-xs text-light/50">Please upload your renewed operating license for admin verification.</p>
          </div>
          
          <div>
            <label className="text-sm text-light/80">Verified Email</label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-light/30" size={18} />
              <input
                type="email"
                readOnly
                className="w-full mt-1 p-3 pl-12 rounded bg-white/5 text-white/50 cursor-not-allowed"
                value={email}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-light/80">New License URL</label>
            <div className="relative group">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-light/30 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="text"
                required
                placeholder="https://..."
                className="w-full mt-1 p-3 pl-12 rounded bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={licenseUrl}
                onChange={(e) => setLicenseUrl(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-light/80">New Expiration Date</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-light/30 group-focus-within:text-primary transition-colors" size={18} />
              <input
                type="date"
                required
                className="w-full mt-1 p-3 pl-12 rounded bg-white/10 text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setIsExpired(false)}
              className="flex-1 py-3 rounded text-white font-bold transition-all bg-white/5 hover:bg-white/10 border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded text-white font-bold transition-all bg-primary hover:bg-red-600 shadow-xl shadow-primary/20"
            >
              {loading ? "Submitting..." : "Submit Renewal"}
            </button>
          </div>
        </motion.form>
      )}
      </AnimatePresence>

      {!isExpired && (
        <div className="mt-6 text-center">
          <Link to="/register" className="text-sm font-bold text-light/40 hover:text-primary transition-colors">
            Register your facility
          </Link>
        </div>
      )}

    </div>
      </div>
    </motion.div>


  );
};

export default Login;
