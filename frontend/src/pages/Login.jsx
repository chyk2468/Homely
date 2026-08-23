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
        background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.15) 0%, rgba(7, 11, 20, 1) 70%)'
      }}
    >
      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* Logo and Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--glow-cyan)',
              marginBottom: '16px'
            }}
          >
            <Building2 size={32} />
          </div>
          <h1 style={{ fontSize: '28px', color: '#ffffff', margin: 0 }}>Homely</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
            Apartment Society Maintenance & Complaint Management
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          {error && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                color: '#fb7185',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '20px'
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
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
              style={{ width: '100%', padding: '12px', marginTop: '8px' }}
            >
              <LogIn size={18} />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)' }}>
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={12} color="var(--accent-cyan)" />
              <span>1-Click Instant Demo Login</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleDemoLogin('resident')}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ padding: '8px 6px', fontSize: '11px', border: '1px solid rgba(99, 102, 241, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
              >
                <User size={15} color="var(--accent-indigo)" />
                <span>Resident</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('staff')}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ padding: '8px 6px', fontSize: '11px', border: '1px solid rgba(167, 139, 250, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
              >
                <Wrench size={15} color="#a78bfa" />
                <span>Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
                className="btn btn-secondary btn-sm"
                style={{ padding: '8px 6px', fontSize: '11px', border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
              >
                <ShieldCheck size={15} color="var(--accent-cyan)" />
                <span>Admin</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer link to Register */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent-cyan)', fontWeight: '600', textDecoration: 'none' }}>
            Register as Resident
          </Link>
        </div>
      </div>
    </div>
  );
};
