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
        backgroundColor: '#F7F7F8'
      }}
    >
      <div style={{ width: '100%', maxWidth: '460px' }}>
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
          <h1 style={{ fontSize: '24px', color: '#222222', margin: 0, fontWeight: '800' }}>Join Homely</h1>
          <p style={{ color: '#777777', fontSize: '13px', marginTop: '4px' }}>
            Register your apartment unit to manage maintenance requests
          </p>
        </div>

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
              style={{ width: '100%', padding: '11px', marginTop: '8px', fontSize: '14px' }}
            >
              <UserPlus size={16} />
              <span>{loading ? 'Creating Account...' : 'Register'}</span>
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: '#777777' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#F04B4F', fontWeight: '600', textDecoration: 'none' }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
