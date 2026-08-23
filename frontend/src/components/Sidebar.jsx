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
  FileText,
  Flame,
  Activity
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
    { to: '/staff/my-assigned', label: 'Assigned Complaints', icon: ListOrdered, badge: overdueCount > 0 ? `${overdueCount} Overdue` : null },
    { to: '/notices', label: 'Notice Board', icon: Bell },
  ];

  const adminNav = [
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, badge: overdueCount > 0 ? `${overdueCount} Overdue` : null },
    { to: '/admin/complaints', label: 'All Complaints', icon: ListOrdered },
    { to: '/admin/notices', label: 'Notice Board', icon: Bell },
    { to: '/admin/staff', label: 'Staff Management', icon: Users },
    { to: '/admin/categories', label: 'Category SLAs', icon: Layers },
    { to: '/admin/audit-logs', label: 'Admin Audit Log', icon: FileText },
    { to: '/admin/settings', label: 'SLA Settings', icon: Sliders },
  ];

  let navItems = residentNav;
  if (isAdmin) navItems = adminNav;
  else if (isStaff) navItems = staffNav;

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
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
            padding: '24px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--glow-cyan)'
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontWeight: '800', fontFamily: 'var(--font-display)', fontSize: '18px', color: '#ffffff', lineHeight: 1.2 }}>
              Homely
            </div>
            <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: '600', letterSpacing: '0.05em' }}>
              SOCIETY MAINTENANCE
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(90deg, rgba(6, 182, 212, 0.15), rgba(99, 102, 241, 0.08))' : 'transparent',
                  border: isActive ? '1px solid var(--border-active)' : '1px solid transparent',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '13px',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
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
                      padding: '2px 6px',
                      borderRadius: '999px',
                      background: 'rgba(244, 63, 94, 0.2)',
                      color: '#fb7185',
                      border: '1px solid rgba(244, 63, 94, 0.4)',
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
          padding: '16px',
          borderTop: '1px solid var(--border-subtle)',
          background: 'rgba(7, 11, 20, 0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: isAdmin
                ? 'rgba(6, 182, 212, 0.2)'
                : isStaff
                ? 'rgba(167, 139, 250, 0.2)'
                : 'rgba(99, 102, 241, 0.2)',
              border: `1px solid ${
                isAdmin
                  ? 'var(--accent-cyan)'
                  : isStaff
                  ? '#a78bfa'
                  : 'var(--accent-indigo)'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isAdmin
                ? 'var(--accent-cyan)'
                : isStaff
                ? '#a78bfa'
                : 'var(--accent-indigo)'
            }}
          >
            {isAdmin ? <ShieldCheck size={20} /> : isStaff ? <Wrench size={20} /> : <User size={20} />}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#ffffff',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {user?.full_name || 'User'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isAdmin
                ? 'Admin Office'
                : isStaff
                ? user?.specialization || 'Maintenance Staff'
                : user?.flat_number || 'Resident'}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn btn-secondary"
          style={{ width: '100%', padding: '8px', fontSize: '13px', display: 'flex', gap: '6px' }}
        >
          <LogOut size={15} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
