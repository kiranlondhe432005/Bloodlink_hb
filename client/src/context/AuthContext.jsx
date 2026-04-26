import React, { createContext, useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';


export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ stable axios instance
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: `${import.meta.env.VITE_API_URL}/api`,
    });

    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return instance;
  }, []);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (loggedInUser && token) {
      setUser(JSON.parse(loggedInUser));
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });

      const userData = res.data.user || res.data;

      setUser(userData);

      // ✅ store separately
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('token', res.data.token);

      toast.success('Logged in successfully');
      return res.data;

    } catch (err) {
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('/auth/register', userData);
      toast.success('Registered successfully. Wait for admin approval');
      return res.data;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.info('Logged out');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, api }}>
      {children} {/* ✅ FIXED */}
    </AuthContext.Provider>
  );
};