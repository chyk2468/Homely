import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, LogIn, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

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

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => {
      setIsShaking(false);
    }, 450);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please provide both email and password.');
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      const user = await login(email, password);
      setLoading(false);
      setIsSuccess(true);

      // Brief pause to display success checkmark, then graceful exit transition
      setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          handleRedirect(user.role);
        }, 380);
      }, 420);
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Login failed. Please check your credentials.');
      triggerShake();
    }
  };

  return (
    <div className="login-page-container">
      {/* 2. Animated Ambient Background Shapes */}
      <div className="login-ambient-background" aria-hidden="true">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>

      {/* 1. Page Content Wrapper */}
      <div className={`login-content-wrapper ${isExiting ? 'login-exiting' : ''}`}>
        {/* Header & Logo */}
        <div className="login-header">
          <div className="login-logo-wrapper">
            <div className="login-logo-container" title="Homely CRM">
              <Building2 size={26} strokeWidth={2.2} />
            </div>
          </div>
          <h1 className="login-title">Homely</h1>
          <p className="login-subtitle">
            Apartment Society Maintenance & Operations CRM
          </p>
        </div>

        {/* 4. Login Form Card */}
        <div className={`login-card ${isShaking ? 'card-shake' : ''}`}>
          {/* 12. Error Banner with smooth slide-down */}
          {error && (
            <div className="login-error-banner" role="alert">
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email Field (Stagger item 1) */}
            <div className="login-input-group stagger-1">
              <label htmlFor="login-email" className="login-input-label">
                Email Address
              </label>
              <div className="login-input-wrapper">
                <input
                  id="login-email"
                  type="email"
                  required
                  autoComplete="email"
                  className="login-input-field"
                  placeholder="name@society.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading || isSuccess}
                />
              </div>
            </div>

            {/* Password Field with Eye Toggle (Stagger item 2) */}
            <div className="login-input-group stagger-2">
              <label htmlFor="login-password" className="login-input-label">
                Password
              </label>
              <div className="login-input-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  className="login-input-field has-eye-toggle"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading || isSuccess}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={16} className="password-eye-icon" />
                  ) : (
                    <Eye size={16} className="password-eye-icon" />
                  )}
                </button>
              </div>
            </div>

            {/* Sign In Button (Stagger item 3) */}
            <div className="stagger-3">
              <button
                type="submit"
                disabled={loading || isSuccess}
                className={`login-submit-btn ${isSuccess ? 'btn-success-state' : ''}`}
                aria-busy={loading}
              >
                {loading ? (
                  <span className="btn-content">
                    <span className="btn-spinner" />
                    <span>Signing In...</span>
                  </span>
                ) : isSuccess ? (
                  <span className="btn-content">
                    <Check size={18} strokeWidth={2.8} className="btn-checkmark-icon" />
                    <span>Success!</span>
                  </span>
                ) : (
                  <span className="btn-content">
                    <LogIn size={16} strokeWidth={2.2} />
                    <span>Sign In</span>
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* 11. Footer Registration Link (Stagger item 4) */}
        <div className="login-footer-text stagger-footer">
          Don't have an account?{' '}
          <Link to="/register" className="register-animated-link">
            Register as Resident
          </Link>
        </div>
      </div>
    </div>
  );
};
