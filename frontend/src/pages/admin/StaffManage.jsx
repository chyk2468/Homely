import React, { useState, useEffect } from 'react';
import { Users, Plus, Wrench, Phone, Mail, CheckCircle2, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
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
        subtitle="Manage in-house technicians, trade specializations, and service dispatch assignments"
        extraAction={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setModalOpen(true)} className="btn btn-primary btn-sm">
              <Plus size={15} />
              <span>Add Staff Member</span>
            </button>
            <button onClick={fetchStaff} className="btn btn-secondary btn-sm" disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
            </button>
          </div>
        }
      />

      <div className="page-body">
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', color: '#ffffff', margin: 0 }}>
              Registered Technicians ({staffList.length})
            </h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              Loading staff accounts...
            </div>
          ) : staffList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              No maintenance staff registered yet. Click "Add Staff Member" to onboard technicians.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
              {staffList.map((st) => (
                <div
                  key={st.id}
                  className="glass-panel"
                  style={{
                    padding: '20px',
                    border: '1px solid var(--border-subtle)',
                    borderLeft: `4px solid ${st.is_active ? '#a78bfa' : '#64748b'}`
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', color: '#ffffff', margin: '0 0 2px 0' }}>
                        {st.full_name}
                      </h3>
                      <span
                        style={{
                          fontSize: '11px',
                          background: 'rgba(167, 139, 250, 0.15)',
                          color: '#a78bfa',
                          padding: '2px 8px',
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
                        background: st.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: st.is_active ? '#34d399' : '#fb7185',
                        fontWeight: '700'
                      }}
                    >
                      {st.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Mail size={13} color="var(--text-muted)" />
                      <span>{st.email}</span>
                    </div>
                    {st.phone_number && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Phone size={13} color="var(--text-muted)" />
                        <span>{st.phone_number}</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={() => toggleActiveStatus(st)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '12px', padding: '4px 10px' }}
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
          maxWidth="550px"
        >
          {error && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                color: '#fb7185',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
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

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setModalOpen(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                <span>{saving ? 'Creating...' : 'Create Staff Account'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
