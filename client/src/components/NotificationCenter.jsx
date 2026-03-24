import React, { useState, useContext } from 'react';
import { Bell, Clock, MapPin, Activity, ShieldCheck, X } from 'lucide-react';
import { NotificationContext } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationCenter = () => {
  const { notifications, markAsRead } = useContext(NotificationContext);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleToggle = () => setIsOpen(prev => !prev);

  const handleMarkRead = (id) => {
    markAsRead(id);
  };

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleToggle}
        className="relative p-3 bg-white/5 border border-white/10 rounded-2xl text-light/40 hover:text-primary hover:bg-white/10 transition-all focus:outline-none group shadow-xl"
      >
        <Bell size={22} className="group-hover:drop-shadow-[0_0_8px_rgba(255,59,59,0.5)]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[8px] font-black text-white items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-4 w-96 glass-panel rounded-3xl shadow-3xl border-white/10 z-30 overflow-hidden ring-1 ring-white/10"
            >
              <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                <div className="flex items-center gap-2">
                  <h3 className="text-[10px] font-black text-light/40 uppercase tracking-[0.3em]">Command Logs</h3>
                  <span className="bg-primary/20 text-primary text-[8px] font-black px-2 py-0.5 rounded-full">{notifications.length}</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="text-light/20 hover:text-light transition-colors"><X size={16} /></button>
              </div>

              <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-16 text-center text-light/10 font-black italic">
                    <Bell className="mx-auto mb-4 opacity-5 animate-pulse" size={48} />
                    <p className="text-sm tracking-widest">NO NEW DATA</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.map((n) => (
                      <motion.div
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        key={n._id}
                        onClick={() => { if (!n.isRead) handleMarkRead(n._id); }}
                        className={`p-6 hover:bg-white/5 cursor-pointer transition-all relative group ${!n.isRead ? 'bg-primary/5' : ''}`}
                      >
                        {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(255,59,59,0.5)]"></div>}
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest ${n.status === 'active' ? 'text-primary' : 'text-light/30'}`}>
                            {n.title}
                          </span>
                          <span className="text-[9px] text-light/20 font-bold flex items-center bg-white/5 px-2 py-0.5 rounded-full">
                            <Clock size={10} className="mr-1" />
                            {n.createdAt ? formatDistanceToNow(new Date(n.createdAt)) : 'Just now'}
                          </span>
                        </div>
                        <p className="text-xs text-light/80 font-bold mb-3 leading-relaxed">{n.message}</p>
                        {n.bloodRequest && (
                          <div className="flex items-center space-x-4 mt-2 text-[10px] font-black text-light/30 uppercase tracking-tighter">
                            <span className="flex items-center bg-white/5 px-2 py-1 rounded-lg border border-white/5"><Activity size={12} className="mr-2 text-primary" /> {n.bloodRequest.bloodGroup}</span>
                            {n.distance && (<span className="flex items-center bg-white/5 px-2 py-1 rounded-lg border border-white/5"><MapPin size={12} className="mr-2 text-secondary" /> {Number(n.distance).toFixed(1)} KM</span>)}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-4 bg-white/5 border-t border-white/5 text-center">
                  <button className="text-[10px] font-black text-primary hover:text-red-400 uppercase tracking-widest transition-colors flex items-center justify-center mx-auto">
                    ARCHIVE ALL DATA <ShieldCheck size={12} className="ml-2" />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
