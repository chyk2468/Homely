import React, { useState, useEffect } from 'react';
import { Plus, Phone, Mail, RefreshCw, AlertCircle } from 'lucide-react';
import { api } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { Modal } from '../../components/Modal';

export const StaffManage = () => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // New staff form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('Plumbing');
  const [phone, setPhone] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const data = await api.getStaffList();
      setStaffList(data);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await api.createStaff({
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim(),
        specialization: specialization.trim(),
        phone_number: phone.trim() || undefined
      });
      setModalOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setPhone('');
      fetchStaff();
    } catch (err) {
      setError(err.message || 'Failed to create staff account.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActiveStatus = async (staffMember) => {
    try {
      await api.updateStaff(staffMember.id, {
        is_active: !staffMember.is_active
      });
      fetchStaff();
    } catch (err) {
      alert(err.message || 'Failed to update staff status.');
    }
  };

  return (
    <>
      <Navbar
        title="Maintenance Staff Management"
        subtitle="Manage technicians, trade specializations, and service dispatch availability"
        extraAction={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={14} />
              <span>Add Staff Member</span>
            </button>
            <button onClick={fetchStaff} className="btn btn-secondary btn-sm" disabled={loading}>
              <RefreshCw size={13} className={loading ? 'spin' : ''} />
            </button>
          </div>
        }
      />

      <div className="page-body">
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E7E7E9',
            borderRadius: '12px',
            padding: '20px 24px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', color: '#222222', margin: 0, fontWeight: '700' }}>
              Registered Technicians ({staffList.length})
            </h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#777777', fontSize: '13px' }}>
              Loading staff accounts...
            </div>
          ) : staffList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#777777' }}>
              No maintenance staff registered yet. Click "Add Staff Member" to onboard technicians.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {staffList.map((st) => (
                <div
                  key={st.id}
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #E7E7E9',
                    borderLeft: `4px solid ${st.is_active ? '#F04B4F' : '#D5D5D8'}`,
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '15px', color: '#222222', margin: '0 0 2px 0', fontWeight: '700' }}>
                        {st.full_name}
                      </h3>
                      <span
                        style={{
                          fontSize: '11px',
                          background: '#FCECED',
                          color: '#F04B4F',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: '700'
                        }}
                      >
                        {st.specialization || 'General Maintenance'}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 8px',
                        borderRadius: '999px',
                        background: st.is_active ? '#EAF7F0' : '#FCECED',
                        color: st.is_active ? '#15803D' : '#F04B4F',
                        border: `1px solid ${st.is_active ? '#C4EDD6' : '#F9D0D2'}`,
                        fontWeight: '700'
                      }}
                    >
                      {st.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', color: '#777777', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={12} color="#A0A0A0" />
                      <span>{st.email}</span>
                    </div>
                    {st.phone_number && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={12} color="#A0A0A0" />
                        <span>{st.phone_number}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', paddingTop: '10px', borderTop: '1px solid #E7E7E9' }}>
                    <button
                      type="button"
                      onClick={() => toggleActiveStatus(st)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '11px', padding: '3px 8px' }}
                    >
                      {st.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Staff Modal */}
      {modalOpen && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Onboard Maintenance Staff Member"
          maxWidth="500px"
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
                marginBottom: '14px'
              }}
            >
              <AlertCircle size={15} />
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleCreateStaff}>
            <div className="input-group">
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                required
                className="input-field"
                placeholder="e.g. Ramesh Kumar"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email Address (Login Username) *</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="e.g. plumber@society.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password *</label>
              <input
                type="password"
                required
                className="input-field"
                placeholder="Initial password (e.g. staff123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Specialization / Trade *</label>
              <select
                className="select-field"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
              >
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Civil & Masonry">Civil & Masonry</option>
                <option value="Elevator & Lifts">Elevator & Lifts</option>
                <option value="Pest Control">Pest Control</option>
                <option value="Cleaning & Sanitation">Cleaning & Sanitation</option>
                <option value="Carpentry">Carpentry</option>
                <option value="General Maintenance">General Maintenance</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Phone Number (Optional)</label>
              <input
                type="text"
                className="input-field"
                placeholder="+91 91234 56780"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                <span>{saving ? 'Creating...' : 'Create Account'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
