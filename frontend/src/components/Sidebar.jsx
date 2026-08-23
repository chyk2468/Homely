import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  Bell,
  Sliders,
  LogOut,
  Building2,
  ShieldCheck,
  User,
  Wrench,
  Users,
  Layers,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ overdueCount = 0 }) => {
  const { user, isAdmin, isStaff, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const residentNav = [
    { to: '/resident/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/resident/new-complaint', label: 'Raise Complaint', icon: PlusCircle },
    { to: '/resident/my-complaints', label: 'My Complaints', icon: ListOrdered },
    { to: '/notices', label: 'Notice Board', icon: Bell },
  ];

  const staffNav = [
    { to: '/staff/dashboard', label: 'Staff Dashboard', icon: LayoutDashboard },
    { to: '/staff/my-assigned', label: 'Assigned Complaints', icon: ListOrdered, badge: overdueCount > 0 ? `${overdueCount}` : null },
    { to: '/notices', label: 'Notice Board', icon: Bell },
  ];

  const adminNav = [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: overdueCount > 0 ? `${overdueCount}` : null },
    { to: '/admin/complaints', label: 'All Complaints', icon: ListOrdered },
    { to: '/admin/notices', label: 'Notice Board', icon: Bell },
    { to: '/admin/staff', label: 'Staff Management', icon: Users },
    { to: '/admin/categories', label: 'Category SLAs', icon: Layers },
    { to: '/admin/audit-logs', label: 'Audit Log', icon: FileText },
    { to: '/admin/settings', label: 'SLA Settings', icon: Sliders },
  ];

  let navItems = residentNav;
  if (isAdmin) navItems = adminNav;
  else if (isStaff) navItems = staffNav;

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: '#FFFFFF',
        borderRight: '1px solid #E7E7E9',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 40
      }}
    >
      {/* Brand Header */}
      <div>
        <div
          style={{
            padding: '20px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            borderBottom: '1px solid #E7E7E9'
          }}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: '#FCECED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F04B4F',
              flexShrink: 0
            }}
          >
            <Building2 size={20} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontFamily: 'var(--font-display)', fontSize: '17px', color: '#222222', lineHeight: 1.1 }}>
              Homely
            </div>
            <div style={{ fontSize: '11px', color: '#777777', fontWeight: '500' }}>
              Society Maintenance
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '14px 10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  color: isActive ? '#F04B4F' : '#777777',
                  background: isActive ? '#FCECED' : 'transparent',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '13px',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease'
                })}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={17} />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '999px',
                      background: '#F04B4F',
                      color: '#ffffff',
                      fontWeight: '700'
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Profile / Logout Section */}
      <div
        style={{
          padding: '14px 12px',
          borderTop: '1px solid #E7E7E9',
          backgroundColor: '#FFFFFF'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', padding: '0 4px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: '#FCECED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F04B4F',
              flexShrink: 0
            }}
          >
            {isAdmin ? <ShieldCheck size={18} /> : isStaff ? <Wrench size={18} /> : <User size={18} />}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#222222',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {user?.full_name || 'User'}
            </div>
            <div style={{ fontSize: '11px', color: '#777777' }}>
              {isAdmin
                ? 'Society Admin'
                : isStaff
                ? user?.specialization || 'Maintenance Staff'
                : user?.flat_number || 'Resident'}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', padding: '7px', fontSize: '12px', display: 'flex', gap: '6px', color: '#777777' }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
