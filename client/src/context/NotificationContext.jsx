import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { toast } from 'react-toastify';

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, api } = useContext(AuthContext);
  const [notifications, setNotifications] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user) return;

    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.emit('join_room', user._id);

    newSocket.on('request_received', (data) => {
      toast.info(`New Request: ${data.hospitalName} needs ${data.bloodGroup}`);
      fetchNotifications();
    });

    newSocket.on('request_accepted', (data) => {
      toast.success(`Request Accepted by ${data.bloodBankName}`);
      fetchNotifications();
    });

    newSocket.on('status_updated', (data) => {
      toast.info(`Status Updated: ${data.status}`);
      fetchNotifications();
    });

    fetchNotifications();

    return () => newSocket.disconnect();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/requests/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/requests/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, socket, fetchNotifications, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};
