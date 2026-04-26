import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    let newSocket;
    if (user && user._id && !socket) {
      newSocket = io(import.meta.env.VITE_API_URL);

      newSocket.on('connect', () => {
        newSocket.emit('join_room', user._id);
        console.log('Socket connected & joined room');
      });

      setSocket(newSocket);
    }

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [user, socket]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};
