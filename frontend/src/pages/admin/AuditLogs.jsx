import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, Clock } from 'lucide-react';
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
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getActionBadgeStyle = (action) => {
    if (!action) return { bg: '#F3F4F6', color: '#4B5563', border: '#E5E7EB' };
    if (action.includes('DELETE') || action.includes('REJECT')) {
      return { bg: '#FCECED', color: '#F04B4F', border: '#F9D0D2' };
    }
    if (action.includes('CREATE') || action.includes('APPROVE')) {
      return { bg: '#EAF7F0', color: '#15803D', border: '#C4EDD6' };
    }
    if (action.includes('ASSIGN')) {
      return { bg: '#FCECED', color: '#F04B4F', border: '#F9D0D2' };
    }
    return { bg: '#FDF6E9', color: '#B45309', border: '#F8E3BC' };
  };

  return (
    <>
      <Navbar
        title="Administrative Audit Trail"
        subtitle="Immutable chronological ledger of all administrative actions and configuration changes"
        extraAction={
          <button onClick={fetchLogs} className="btn btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
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
              Audit Entries ({logs.length})
            </h2>
            <span style={{ fontSize: '11px', color: '#777777' }}>
              Recent administrative events
            </span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#777777', fontSize: '13px' }}>
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#777777' }}>
              No audit logs recorded yet.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #E7E7E9', textAlign: 'left', color: '#777777' }}>
                    <th style={{ padding: '10px 12px', fontWeight: '700' }}>Timestamp</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700' }}>Actor</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700' }}>Action</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700' }}>Target</th>
                    <th style={{ padding: '10px 12px', fontWeight: '700' }}>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const badge = getActionBadgeStyle(log.action);
                    return (
                      <tr
                        key={log.id}
                        style={{
                          borderBottom: '1px solid #F3F3F5',
                          transition: 'background 0.15s'
                        }}
                      >
                        <td style={{ padding: '10px 12px', color: '#777777', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={11} color="#A0A0A0" />
                            <span>{formatDate(log.created_at)}</span>
                          </div>
                        </td>

                        <td style={{ padding: '10px 12px', color: '#222222', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldCheck size={13} color="#F04B4F" />
                            <span>{log.admin_name || `Admin #${log.admin_id}`}</span>
                          </div>
                        </td>

                        <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`
                            }}
                          >
                            {log.action}
                          </span>
                        </td>

                        <td style={{ padding: '10px 12px', color: '#777777', whiteSpace: 'nowrap' }}>
                          <span style={{ textTransform: 'capitalize' }}>{log.target_entity}</span>
                          {log.target_id && (
                            <span style={{ color: '#F04B4F', fontWeight: '600', marginLeft: '4px' }}>
                              #{log.target_id}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '10px 12px', color: '#222222', maxWidth: '360px' }}>
                          {log.details || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
