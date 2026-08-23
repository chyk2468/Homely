import React, { useState, useEffect } from 'react';
import {
  User,
  Shield,
  KeyRound,
  Phone,
  Home,
  Mail,
  CheckCircle2,
  AlertCircle,
  Save,
  ShieldCheck,
  Wrench
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';

export const Profile = () => {
  const { user, updateProfile, isAdmin, isStaff, isResident } = useAuth();

  // Profile Form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [flatNumber, setFlatNumber] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone_number || '');
      setFlatNumber(user.flat_number || '');
    }
  }, [user]);

  const handleUpdateProfileDetails = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileSaving(true);

    try {
      await updateProfile({
        full_name: fullName.trim(),
        phone_number: phone.trim() || null,
        flat_number: isResident ? (flatNumber.trim() || null) : undefined
      });
      setProfileSuccess('Profile details saved successfully!');
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setPasswordSaving(true);

    try {
      await updateProfile({
        current_password: currentPassword,
        new_password: newPassword
      });
      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <>
      <Navbar
        title="Account & Profile Settings"
        subtitle="Manage your personal details, contact preferences, and login security credentials"
      />

      <div className="page-body" style={{ maxWidth: '960px' }}>
        {/* User Identity Header Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E7E7E9',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#FCECED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F04B4F',
                fontSize: '22px',
                fontWeight: '700',
                flexShrink: 0
              }}
            >
              {isAdmin ? <ShieldCheck size={28} /> : isStaff ? <Wrench size={28} /> : <User size={28} />}
            </div>

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#222222', margin: 0 }}>
                {user?.full_name || 'User Profile'}
              </h2>
              <div style={{ fontSize: '12px', color: '#777777', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>{user?.email}</span>
                {user?.flat_number && <span>&bull; Flat {user.flat_number}</span>}
                {user?.specialization && <span>&bull; {user.specialization}</span>}
              </div>
            </div>
          </div>

          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                padding: '4px 10px',
                borderRadius: '999px',
                background: '#FCECED',
                color: '#F04B4F',
                border: '1px solid #F9D0D2',
                textTransform: 'uppercase',
                letterSpacing: '0.04em'
              }}
            >
              {isAdmin ? 'Society Administrator' : isStaff ? 'Maintenance Staff' : 'Resident'}
            </span>
          </div>
        </div>

        {/* 2-Column Profile & Security Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Card 1: Personal Details */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E9',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <User size={18} color="#F04B4F" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#222222', margin: 0 }}>
                Personal Information
              </h3>
            </div>

            {profileSuccess && (
              <div
                style={{
                  background: '#EAF7F0',
                  border: '1px solid #C4EDD6',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#15803D',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '14px'
                }}
              >
                <CheckCircle2 size={15} />
                <div>{profileSuccess}</div>
              </div>
            )}

            {profileError && (
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
                  gap: '6px',
                  marginBottom: '14px'
                }}
              >
                <AlertCircle size={15} />
                <div>{profileError}</div>
              </div>
            )}

            <form onSubmit={handleUpdateProfileDetails}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Email Address (Read-only)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    disabled
                    className="input-field"
                    value={user?.email || ''}
                    style={{ backgroundColor: '#F7F7F8', color: '#777777', cursor: 'not-allowed' }}
                  />
                  <Mail size={14} style={{ position: 'absolute', right: '12px', top: '12px', color: '#A0A0A0' }} />
                </div>
              </div>

              {isResident && (
                <div className="input-group">
                  <label className="input-label">Flat / Unit Number</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="input-field"
                      value={flatNumber}
                      onChange={(e) => setFlatNumber(e.target.value)}
                      placeholder="e.g. Tower A - 402"
                    />
                    <Home size={14} style={{ position: 'absolute', right: '12px', top: '12px', color: '#A0A0A0' }} />
                  </div>
                </div>
              )}

              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input-field"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                  <Phone size={14} style={{ position: 'absolute', right: '12px', top: '12px', color: '#A0A0A0' }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={profileSaving}
                  className="btn btn-primary"
                  style={{ padding: '9px 18px', fontSize: '13px' }}
                >
                  <Save size={14} />
                  <span>{profileSaving ? 'Saving...' : 'Save Profile Details'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Security & Password */}
          <div
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E9',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <KeyRound size={18} color="#F04B4F" />
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#222222', margin: 0 }}>
                Change Password
              </h3>
            </div>

            {passwordSuccess && (
              <div
                style={{
                  background: '#EAF7F0',
                  border: '1px solid #C4EDD6',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  color: '#15803D',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginBottom: '14px'
                }}
              >
                <CheckCircle2 size={15} />
                <div>{passwordSuccess}</div>
              </div>
            )}

            {passwordError && (
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
                  gap: '6px',
                  marginBottom: '14px'
                }}
              >
                <AlertCircle size={15} />
                <div>{passwordError}</div>
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="input-group">
                <label className="input-label">Current Password</label>
                <input
                  type="password"
                  required
                  className="input-field"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">New Password (Min 6 chars)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="input-field"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="input-field"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="btn btn-primary"
                  style={{ padding: '9px 18px', fontSize: '13px' }}
                >
                  <Shield size={14} />
                  <span>{passwordSaving ? 'Updating...' : 'Update Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
