import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';

export const ProtectedRoute = ({ requiredRole }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--accent-cyan)'
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px' }}>SocietyCare</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading session...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/resident/dashboard'} replace />;
  }

  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};
