import React from 'react';
import { ShieldCheck, UserCheck, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

export const Navbar = ({ title, subtitle, extraAction }) => {
  const { user, isAdmin, isStaff } = useAuth();

  return (
    <header
      style={{
        padding: '16px 32px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(13, 21, 39, 0.75)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}
    >
      <div>
        <h1 style={{ fontSize: '20px', margin: 0, color: '#ffffff' }}>{title}</h1>
        {subtitle && (
          <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {extraAction}

        <NotificationDropdown />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: '999px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-subtle)',
            fontSize: '12px'
          }}
        >
          {isAdmin ? (
            <>
              <ShieldCheck size={14} color="var(--accent-cyan)" />
              <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>Admin Mode</span>
            </>
          ) : isStaff ? (
            <>
              <Wrench size={14} color="#a78bfa" />
              <span style={{ color: '#a78bfa', fontWeight: '600' }}>{user?.specialization || 'Staff'}</span>
            </>
          ) : (
            <>
              <UserCheck size={14} color="var(--accent-indigo)" />
              <span style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>{user?.flat_number || 'Resident'}</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
