import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, RefreshCw, Clock, Tag } from 'lucide-react';
import { api } from '../../api/client';
import { Navbar } from '../../components/Navbar';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDate = (isoString) => {
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getActionColor = (action) => {
    if (!action) return 'var(--accent-cyan)';
    if (action.includes('DELETE') || action.includes('REJECT')) return '#fb7185';
    if (action.includes('CREATE') || action.includes('APPROVE')) return 'var(--accent-emerald)';
    if (action.includes('ASSIGN')) return '#a78bfa';
    return 'var(--accent-cyan)';
  };

  return (
    <>
      <Navbar
        title="Administrative Audit Trail"
        subtitle="Immutable chronological ledger of all administrative mutations, role actions, and configuration changes"
        extraAction={
          <button onClick={fetchLogs} className="btn btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="page-body">
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '16px', color: '#ffffff', margin: 0 }}>
              Audit Entries ({logs.length})
            </h2>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing recent administrative events
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              No audit logs recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 14px', fontWeight: '600' }}>Timestamp</th>
                    <th style={{ padding: '12px 14px', fontWeight: '600' }}>Admin Actor</th>
                    <th style={{ padding: '12px 14px', fontWeight: '600' }}>Action</th>
                    <th style={{ padding: '12px 14px', fontWeight: '600' }}>Target Entity</th>
                    <th style={{ padding: '12px 14px', fontWeight: '600' }}>Mutation Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s'
                      }}
                    >
                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={12} color="var(--text-muted)" />
                          <span>{formatDate(log.created_at)}</span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', color: '#ffffff', fontWeight: '600', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <ShieldCheck size={14} color="var(--accent-cyan)" />
                          <span>{log.admin_name || `Admin #${log.admin_id}`}</span>
                        </div>
                      </td>

                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: '700',
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            color: getActionColor(log.action),
                            border: `1px solid ${getActionColor(log.action)}33`
                          }}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <span style={{ textTransform: 'capitalize' }}>{log.target_entity}</span>
                        {log.target_id && (
                          <span style={{ color: 'var(--accent-cyan)', fontWeight: '600', marginLeft: '4px' }}>
                            #{log.target_id}
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '12px 14px', color: '#e2e8f0', maxWidth: '380px' }}>
                        {log.details || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
