import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCheck, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';

export const Navbar = ({ title, subtitle, extraAction }) => {
  const { user, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();

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
        zIndex: 30,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)'
      }}
    >
      <div>
        <h1
          style={{
            fontSize: '20px',
            margin: 0,
            color: '#222222',
            fontWeight: '700',
            animation: 'itemSlideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards'
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: '2px 0 0 0',
              fontSize: '13px',
              color: '#777777',
              animation: 'itemSlideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both'
            }}
          >
            {subtitle}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          animation: 'itemSlideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) 0.1s both'
        }}
      >
        {extraAction}

        <NotificationDropdown />

        <div
          onClick={() => navigate('/profile')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '8px',
            background: '#F7F7F8',
            border: '1px solid #E7E7E9',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'background-color 0.18s ease, border-color 0.18s ease, transform 0.18s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#FCECED';
            e.currentTarget.style.borderColor = '#F9D0D2';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#F7F7F8';
            e.currentTarget.style.borderColor = '#E7E7E9';
            e.currentTarget.style.transform = 'none';
          }}
          title="Account Profile & Settings"
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
