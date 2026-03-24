import React from 'react';
import { CheckCircle, Clock, Truck, Package, AlertCircle, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

const TimelineItem = ({ icon: Icon, title, time, isLast, status }) => {
  const getColors = () => {
    if (status === 'completed') return {
      circle: 'bg-green-500/20 text-success border-success/30 shadow-[0_0_15px_rgba(0,230,118,0.2)]',
      line: 'bg-success/20'
    };
    if (status === 'active') return {
      circle: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse shadow-[0_0_15px_rgba(30,144,255,0.3)]',
      line: 'bg-blue-500/10 border-dashed border-blue-500/30 border-l-2'
    };
    return {
      circle: 'bg-white/5 text-light/20 border-white/5',
      line: 'bg-white/5'
    };
  };

  const colors = getColors();

  return (
    <motion.div
      initial={{ x: -10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="relative pl-12 pb-10 transition-all"
    >
      {!isLast && (
        <div className={`absolute left-[19px] top-10 bottom-0 w-[2px] ${colors.line}`}></div>
      )}
      <motion.div
        whileHover={{ scale: 1.2 }}
        className={`absolute left-0 top-0 w-10 h-10 rounded-2xl flex items-center justify-center z-10 border transition-all ${colors.circle}`}
      >
        <Icon size={18} />
      </motion.div>
      <div className="pt-1">
        <p className={`text-[11px] font-black tracking-[0.2em] uppercase ${status === 'pending' ? 'text-light/20' : 'text-light'}`}>
          {title}
        </p>
        {time ? (
          <p className="text-[10px] font-bold text-light/30 uppercase mt-1 flex items-center">
            <Clock size={10} className="mr-2" /> {time && !isNaN(new Date(time))
              ? format(new Date(time), 'hh:mm a')
              : 'N/A'}
          </p>
        ) : (
          <p className="text-[9px] font-black text-light/10 uppercase mt-1 tracking-widest italic">Awaiting Signal</p>
        )}
      </div>
    </motion.div>
  );
};

const RequestTimeline = ({ request }) => {
  if (!request) return null;

  return (
    <div className="glass-panel p-8 rounded-[32px] border-white/5 shadow-2xl overflow-hidden relative">
      <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
        <ShieldCheck size={80} />
      </div>
      <h4 className="text-[10px] font-black text-light/20 uppercase tracking-[0.4em] mb-10 flex items-center italic">
        <Activity size={14} className="mr-3 text-primary animate-pulse" /> Telemetry Stream
      </h4>
      <div className="mt-4">
        <TimelineItem
          icon={AlertCircle}
          title="Emergency Broadcast"
          time={request.createdAt}
          status="completed"
        />
        <TimelineItem
          icon={CheckCircle}
          title="Unit Allocation"
          time={request.acceptedAt}
          status={request.acceptedAt ? 'completed' : 'active'}
        />
        <TimelineItem
          icon={Truck}
          title="Tactical Dispatch"
          time={request.onTheWayAt}
          status={request.onTheWayAt ? 'completed' : (request.acceptedAt ? 'active' : 'pending')}
        />
        <TimelineItem
          icon={Package}
          title="Mission Delivery"
          time={request.deliveredAt}
          isLast={true}
          status={request.deliveredAt ? 'completed' : (request.onTheWayAt ? 'active' : 'pending')}
        />
      </div>
    </div>
  );
};

export default RequestTimeline;
