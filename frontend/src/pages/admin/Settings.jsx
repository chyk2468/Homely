import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Save, Clock } from 'lucide-react';
import { api } from '../../api/client';
import { Navbar } from '../../components/Navbar';

export const AdminSettings = () => {
  const [thresholdDays, setThresholdDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getOverdueThreshold();
      setThresholdDays(data.overdue_threshold_days);
    } catch {
      setError('Failed to fetch settings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await api.updateOverdueThreshold(thresholdDays);
      setSuccess(`Overdue threshold updated to ${res.overdue_threshold_days} days! Active complaints have been recalculated.`);
    } catch (err) {
      setError(err.message || 'Failed to update threshold.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Navbar
        title="System & SLA Settings"
        subtitle="Configure default complaint escalation thresholds and automated detection parameters"
      />

      <div className="page-body" style={{ maxWidth: '760px' }}>
        {success && (
          <div
            style={{
              background: '#EAF7F0',
              border: '1px solid #C4EDD6',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#15803D',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <CheckCircle2 size={16} />
            <div>{success}</div>
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#FCECED',
              border: '1px solid #F9D0D2',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#F04B4F',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '16px'
            }}
          >
            <AlertCircle size={16} />
            <div>{error}</div>
          </div>
        )}

        {/* Configuration Card */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E7E7E9',
            borderRadius: '12px',
            padding: '28px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                background: '#FCECED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#F04B4F'
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', color: '#222222', margin: 0, fontWeight: '700' }}>
                Default Overdue Escalation Threshold
              </h2>
              <p style={{ fontSize: '12px', color: '#777777', margin: '2px 0 0 0' }}>
                Define how many days an unresolved complaint can stay open before flagging as overdue
              </p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="input-group">
              <label className="input-label">Threshold Duration (Days)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="number"
                  min="1"
                  max="365"
                  required
                  className="input-field"
                  style={{ width: '120px', fontSize: '15px', fontWeight: '700' }}
                  value={thresholdDays}
                  onChange={(e) => setThresholdDays(parseInt(e.target.value) || '')}
                />
                <span style={{ color: '#777777', fontSize: '13px' }}>
                  Days after creation
                </span>
              </div>
            </div>

            {/* Explanatory Info Box */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '8px',
                background: '#F7F7F8',
                borderLeft: '4px solid #F04B4F',
                border: '1px solid #E7E7E9',
                margin: '20px 0',
                fontSize: '12px',
                color: '#444444',
                lineHeight: '1.6'
              }}
            >
              <strong style={{ color: '#222222' }}>How Overdue Detection Works:</strong>
              <ul style={{ margin: '6px 0 0 16px', padding: 0 }}>
                <li>Any ticket in <em>Open</em> or <em>In Progress</em> status older than this threshold is flagged as <strong>Overdue</strong>.</li>
                <li>Overdue complaints automatically surface at the top of the Admin and Staff review queues.</li>
                <li>When a technician or administrator marks a complaint as <em>Resolved</em>, the overdue flag is automatically cleared.</li>
                <li>Saving this form immediately re-evaluates all complaints in the database against the new threshold.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="submit"
                disabled={saving || loading}
                className="btn btn-primary"
                style={{ padding: '10px 20px' }}
              >
                <Save size={15} />
                <span>{saving ? 'Saving...' : 'Save & Recalculate'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
