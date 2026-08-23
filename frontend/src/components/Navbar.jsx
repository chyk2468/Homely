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
        borderBottom: '1px solid #E7E7E9',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}
    >
      <div>
        <h1 style={{ fontSize: '20px', margin: 0, color: '#222222', fontWeight: '700' }}>{title}</h1>
        {subtitle && (
          <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#777777' }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {extraAction}

        <NotificationDropdown />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '8px',
            background: '#F7F7F8',
            border: '1px solid #E7E7E9',
            fontSize: '12px'
          }}
        >
          {isAdmin ? (
            <>
              <ShieldCheck size={14} color="#F04B4F" />
              <span style={{ color: '#222222', fontWeight: '600' }}>Admin Mode</span>
            </>
          ) : isStaff ? (
            <>
              <Wrench size={14} color="#F04B4F" />
              <span style={{ color: '#222222', fontWeight: '600' }}>{user?.specialization || 'Staff'}</span>
            </>
          ) : (
            <>
              <UserCheck size={14} color="#777777" />
              <span style={{ color: '#222222', fontWeight: '500' }}>{user?.flat_number || 'Resident'}</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
