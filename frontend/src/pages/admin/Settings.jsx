import React, { useState, useEffect } from 'react';
import { Sliders, CheckCircle2, AlertCircle, Save, Clock, Shield } from 'lucide-react';
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
    } catch (err) {
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
      setSuccess(`Overdue threshold updated to ${res.overdue_threshold_days} days! All open complaints have been recalculated.`);
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
        subtitle="Configure complaint escalation rules, overdue thresholds, and automated detection parameters"
      />

      <div className="page-body" style={{ maxWidth: '800px' }}>
        {success && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: '#34d399',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}
          >
            <CheckCircle2 size={16} />
            <div>{success}</div>
          </div>
        )}

        {error && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: '#fb7185',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={16} />
            <div>{error}</div>
          </div>
        )}

        {/* Configuration Card */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(6, 182, 212, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)'
              }}
            >
              <Clock size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', color: '#ffffff', margin: 0 }}>
                Overdue Escalation SLA Threshold
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Define how many days an unresolved complaint can stay open before flagging as overdue
              </p>
            </div>
          </div>

          <form onSubmit={handleSave}>
            <div className="input-group">
              <label className="input-label">Threshold Duration (Days)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="number"
                  min="1"
                  max="365"
                  required
                  className="input-field"
                  style={{ width: '140px', fontSize: '16px', fontWeight: '700' }}
                  value={thresholdDays}
                  onChange={(e) => setThresholdDays(parseInt(e.target.value) || '')}
                />
                <span style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Days after creation
                </span>
              </div>
            </div>

            {/* Explanatory Info Box */}
            <div
              style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(13, 21, 39, 0.8)',
                borderLeft: '4px solid var(--accent-cyan)',
                margin: '24px 0',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.6'
              }}
            >
              <strong style={{ color: '#ffffff' }}>How Overdue Detection Works:</strong>
              <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
                <li>Any ticket in <em>Open</em> or <em>In Progress</em> status older than this threshold is automatically flagged as <strong>Overdue</strong>.</li>
                <li>Overdue complaints automatically surface at the top of the Admin review queue.</li>
                <li>When an administrator marks a complaint as <em>Resolved</em>, the overdue flag is automatically cleared.</li>
                <li>Saving this form immediately re-evaluates all complaints in the database against the new threshold.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button
                type="submit"
                disabled={saving || loading}
                className="btn btn-primary"
                style={{ padding: '12px 24px' }}
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save & Recalculate'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
