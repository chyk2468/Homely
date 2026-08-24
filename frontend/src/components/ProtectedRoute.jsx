import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Sidebar } from './Sidebar';
import { PageTransition } from './PageTransition';

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
          backgroundColor: '#F7F7F8'
        }}
      >
        <div style={{ textAlign: 'center', animation: 'scalePopIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#FCECED',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F04B4F',
              marginBottom: '12px',
              boxShadow: '0 0 16px rgba(240, 75, 79, 0.18)'
            }}
          >
            <Building2 size={24} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#222222' }}>
            Homely
          </div>
          <div style={{ color: '#777777', fontSize: '13px', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span className="btn-spinner" style={{ borderColor: 'rgba(240,75,79,0.3)', borderTopColor: '#F04B4F', width: '13px', height: '13px' }} />
            <span>Loading workspace...</span>
          </div>
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
        <PageTransition>
          <Outlet />
        </PageTransition>
      </div>
    </div>
  );
};
