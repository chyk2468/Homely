import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, LogIn, ShieldCheck, User, Wrench, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRedirect = (role) => {
    if (role === 'admin') {
      navigate('/admin/dashboard');
    } else if (role === 'staff') {
      navigate('/staff/dashboard');
    } else {
      navigate('/resident/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      handleRedirect(user.role);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (roleType) => {
    setError('');
    setLoading(true);
    let demoEmail = 'resident@society.com';
    let demoPass = 'resident123';

    if (roleType === 'admin') {
      demoEmail = 'admin@society.com';
      demoPass = 'admin123';
    } else if (roleType === 'staff') {
      demoEmail = 'plumber@society.com';
      demoPass = 'staff123';
    }

    setEmail(demoEmail);
    setPassword(demoPass);

    try {
      const user = await login(demoEmail, demoPass);
      handleRedirect(user.role);
    } catch (err) {
      setError(err.message || 'Demo login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        backgroundColor: '#F7F7F8'
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#FCECED',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#F04B4F',
              marginBottom: '12px'
            }}
          >
            <Building2 size={26} />
          </div>
          <h1 style={{ fontSize: '24px', color: '#222222', margin: 0, fontWeight: '800' }}>Homely</h1>
          <p style={{ color: '#777777', fontSize: '13px', marginTop: '4px' }}>
            Apartment Society Maintenance & Operations CRM
          </p>
        </div>

        {/* Form Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E7E7E9',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
          }}
        >
          {error && (
            <div
              style={{
                background: '#FCECED',
                border: '1px solid #F9D0D2',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#F04B4F',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="name@society.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '11px', marginTop: '6px', fontSize: '14px' }}
            >
              <LogIn size={16} />
              <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E7E7E9' }}>
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#777777',
                textAlign: 'center',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontWeight: '600'
              }}
            >
              <Sparkles size={12} color="#F04B4F" />
              <span>1-Click Instant Demo Login</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleDemoLogin('resident')}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ padding: '7px 4px', fontSize: '11px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}
              >
                <User size={14} color="#777777" />
                <span>Resident</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('staff')}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ padding: '7px 4px', fontSize: '11px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}
              >
                <Wrench size={14} color="#777777" />
                <span>Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ padding: '7px 4px', fontSize: '11px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}
              >
                <ShieldCheck size={14} color="#F04B4F" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer link to Register */}
        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: '#777777' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#F04B4F', fontWeight: '600', textDecoration: 'none' }}>
            Register as Resident
          </Link>
        </div>
      </div>
    </div>
  );
};
