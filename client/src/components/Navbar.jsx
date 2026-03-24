import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, LogOut, User as UserIcon, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import NotificationCenter from './NotificationCenter';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setTimeout(() => navigate('/'), 100);
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    const role = user.role?.toLowerCase();
    if (role === 'admin') return '/admin';
    if (role === 'hospital') return '/hospital';
    return '/bloodbank';
  };

  return (
    <nav className="sticky top-4 z-50 px-4 md:px-8">
      <div className="glass-panel rounded-2xl h-16 flex items-center justify-between px-6 shadow-xl border-white/5 overflow-hidden">
        {/* Animated Background Blur Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-full bg-primary/5 blur-2xl" />

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to={getDashboardLink()} className="flex items-center space-x-2 text-primary group">
            <Activity size={32} className="group-hover:drop-shadow-[0_0_8px_rgba(255,59,59,0.5)] transition-all" />
            <span className="text-2xl font-black tracking-tighter text-light">BloodLink</span>
          </Link>
        </motion.div>

        <div className="flex items-center space-x-6">
          {user && (
            <motion.div whileHover={{ scale: 1.1 }} className="relative text-light/80 hover:text-primary transition-colors cursor-pointer">
              <NotificationCenter />
            </motion.div>
          )}

          <div className="flex items-center space-x-5">
            {user ? (
              <>
                <div className="hidden lg:flex flex-col items-end mr-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mb-1">{user.role}</span>
                  <span className="text-sm font-semibold text-light/90 leading-none">{user.name}</span>
                </div>

                <div className="h-8 w-[1px] bg-white/10 hidden md:block" />

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white px-5 py-2 rounded-xl transition-all duration-300 font-bold text-sm shadow-lg shadow-primary/5"
                >
                  <LogOut size={16} /> <span className="hidden sm:inline">Logout</span>
                </motion.button>
              </>
            ) : (
              <div className="flex items-center space-x-6">
                <Link to="/" className="text-sm font-bold text-light/70 hover:text-light transition-all">Login</Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/register" className="bg-primary hover:bg-red-600 text-white px-6 py-2.5 rounded-xl transition-all duration-300 font-bold text-sm shadow-lg shadow-primary/20 ring-1 ring-primary/50">
                    Join Now
                  </Link>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
