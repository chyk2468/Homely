import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, UserPlus, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import './Login.css';

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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      triggerShake();
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      triggerShake();
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
      setLoading(false);
      setSuccess(true);
      toast.success('Registration successful', `Welcome to Homely, ${formData.full_name}!`);

      setTimeout(() => {
        navigate(user.role === 'admin' ? '/admin/dashboard' : '/resident/dashboard');
      }, 700);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Registration failed. Please check your details.');
      triggerShake();
      toast.error('Registration failed', err.message || 'Please check your details.');
    }
  };

  return (
    <div className="login-container">
      {/* Ambient background glow layers */}
      <div className="login-bg-glow login-bg-glow-1" />
      <div className="login-bg-glow login-bg-glow-2" />

      <div className={`login-card-wrapper ${isShaking ? 'login-card-shake' : ''}`} style={{ maxWidth: '480px' }}>
        {/* Header Branding */}
        <div className="login-header">
          <div className="login-logo-badge">
            <Building2 size={26} />
          </div>
          <h1 className="login-title">Join Homely</h1>
          <p className="login-subtitle">
            Register your apartment unit to manage maintenance requests
          </p>
        </div>

        {/* Card */}
        <div className="login-card">
          {error && (
            <div className="login-error-banner">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form-stagger">
            <div className="input-group login-field-1">
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                name="full_name"
                required
                className="input-field"
                placeholder="e.g. John Doe"
                value={formData.full_name}
                onChange={handleChange}
                disabled={loading || success}
              />
            </div>

            <div className="input-group login-field-2">
              <label className="input-label">Email Address *</label>
              <input
                type="email"
                name="email"
                required
                className="input-field"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading || success}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="login-field-3">
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
                  disabled={loading || success}
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
                  disabled={loading || success}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="login-field-4">
              <div className="input-group">
                <label className="input-label">Password *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    className="input-field"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading || success}
                    style={{ paddingRight: '36px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="password-toggle-btn"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Confirm Password *</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirm_password"
                  required
                  className="input-field"
                  placeholder="••••••••"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  disabled={loading || success}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className={`btn ${success ? 'btn-success' : 'btn-primary'} login-submit-btn login-field-5`}
            >
              {loading ? (
                <span className="btn-spinner" />
              ) : success ? (
                <Check size={18} className="btn-checkmark-icon" />
              ) : (
                <UserPlus size={16} />
              )}
              <span>
                {loading ? 'Creating Account...' : success ? 'Account Created!' : 'Register'}
              </span>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="login-footer">
          Already have an account?{' '}
          <Link to="/login" className="login-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
