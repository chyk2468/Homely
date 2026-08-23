import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    flat_number: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    role: 'resident'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const user = await register({
        email: formData.email,
        full_name: formData.full_name,
        flat_number: formData.flat_number,
        phone_number: formData.phone_number,
        password: formData.password,
        role: formData.role
      });
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/resident/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your details.');
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
        background: 'radial-gradient(circle at 50% 30%, rgba(99, 102, 241, 0.12) 0%, rgba(7, 11, 20, 1) 70%)'
      }}
    >
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: 'var(--glow-cyan)',
              marginBottom: '14px'
            }}
          >
            <Building2 size={28} />
          </div>
          <h1 style={{ fontSize: '26px', color: '#ffffff', margin: 0 }}>Join Homely</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Register your apartment unit to manage maintenance requests
          </p>
        </div>

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
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                name="full_name"
                required
                className="input-field"
                placeholder="e.g. John Doe"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                className="input-field"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Flat / Unit Number *</label>
                <input
                  type="text"
                  name="flat_number"
                  required
                  className="input-field"
                  placeholder="e.g. A-402, Tower 1"
                  value={formData.flat_number}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <input
                  type="text"
                  name="phone_number"
                  className="input-field"
                  placeholder="+91 98765 43210"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label className="input-label">Password *</label>
                <input
                  type="password"
                  name="password"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Confirm Password *</label>
                <input
                  type="password"
                  name="confirm_password"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={formData.confirm_password}
                  onChange={handleChange}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', marginTop: '12px' }}
            >
              <UserPlus size={18} />
              <span>{loading ? 'Creating Account...' : 'Register'}</span>
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-cyan)', fontWeight: '600', textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
