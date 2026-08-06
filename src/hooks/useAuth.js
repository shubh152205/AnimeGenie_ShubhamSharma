import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function useAuth({ showToast }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('salesgenie_token') || null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  // Validate existing token on mount
  useEffect(() => {
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Token expired');
        })
        .then(userData => setUser(userData))
        .catch(() => {
          localStorage.removeItem('salesgenie_token');
          setToken(null);
          setUser(null);
        });
    }
  }, [token]);

  const handleLogin = async (username, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Login failed');

      localStorage.setItem('salesgenie_token', data.access_token);
      setToken(data.access_token);
      setUser({ username: data.username, email: data.email, role: data.role });
      setIsAuthModalOpen(false);
      if (showToast) showToast(`Welcome back, ${data.username}!`, 'success');
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (username, email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Registration failed');

      localStorage.setItem('salesgenie_token', data.access_token);
      setToken(data.access_token);
      setUser({ username: data.username, email: data.email, role: data.role });
      setIsAuthModalOpen(false);
      if (showToast) showToast(`Account created for ${data.username}!`, 'success');
    } catch (err) {
      if (showToast) showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('salesgenie_token');
    setToken(null);
    setUser(null);
    if (showToast) showToast('Logged out successfully', 'info');
  };

  return {
    user,
    token,
    isAuthModalOpen,
    setIsAuthModalOpen,
    authMode,
    setAuthMode,
    loading,
    handleLogin,
    handleRegister,
    handleLogout
  };
}
