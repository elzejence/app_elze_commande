import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// Si le proxy React ne fonctionne pas, on utilise l'URL directe du backend
const BASE_URL = process.env.REACT_APP_API_URL
  ? `${process.env.REACT_APP_API_URL}/api`
  : '/api';

export const API = axios.create({
  baseURL: BASE_URL,
  timeout: 10000, // 10 secondes max
});

API.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

API.interceptors.response.use(
  r => r,
  err => {
    // Erreur réseau (backend pas démarré)
    if (!err.response) {
      err.message = 'Impossible de contacter le serveur. Vérifiez que le backend est démarré sur le port 5000.';
    }
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('token')) { setLoading(false); return; }
    API.get('/auth/me')
      .then(r => setUser(r.data.user))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (creds) => {
    const r = await API.post('/auth/login', creds);
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };
  const register = async (data) => {
    const r = await API.post('/auth/register', data);
    localStorage.setItem('token', r.data.token);
    setUser(r.data.user);
    return r.data.user;
  };
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('cart');
    setUser(null);
    window.location.href = '/login';
  };
  const refreshUser = async () => {
    const r = await API.get('/auth/me');
    setUser(r.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
