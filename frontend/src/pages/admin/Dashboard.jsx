import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertCircle,
  Clock,
  CheckCircle2,
  ListOrdered,
  Flame,
  TrendingUp,
  Percent,
  Timer,
  Star,
  Users,
  Wrench,
  Layers,
  ArrowRight,
  RefreshCw,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { StatsCard } from '../../components/StatsCard';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SLACountdownBadge } from '../../components/SLACountdownBadge';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatDate = (isoString) => {
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <>
      <Navbar
        title="Administrative Dashboard & Smart Analytics"
        subtitle="Live society maintenance health, staff workloads, SLA compliance, and recurring patterns"
        extraAction={
          <button onClick={fetchStats} className="btn btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="page-body">
        {/* Recurring Issues Banner if detected */}
        {stats?.recurring_issues && stats.recurring_issues.length > 0 && (
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              marginBottom: '24px',
              borderLeft: '4px solid #f59e0b',
              background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12), rgba(13, 21, 39, 0.7))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertTriangle size={22} color="#fbbf24" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>
                  ⚠️ {stats.recurring_issues.length} Recurring Issue Pattern{stats.recurring_issues.length > 1 ? 's' : ''} Detected (Past 30 Days)
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {stats.recurring_issues[0].category} issues clustered around {stats.recurring_issues[0].location} ({stats.recurring_issues[0].complaint_count} incidents). Preventive maintenance recommended.
                </div>
              </div>
            </div>

            <Link to="/admin/complaints" className="btn btn-secondary btn-sm">
              <span>Inspect Clusters</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* 4 Primary KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '24px'
          }}
        >
          <StatsCard
            title="Total Complaints"
            value={stats?.total_complaints ?? 0}
            icon={ListOrdered}
            color="indigo"
            subtitle="All logged records"
            onClick={() => navigate('/admin/complaints')}
          />
          <StatsCard
            title="Open Tickets"
            value={stats?.open_complaints ?? 0}
            icon={AlertCircle}
            color="amber"
            subtitle="Awaiting action"
            onClick={() => navigate('/admin/complaints?status=Open')}
          />
          <StatsCard
            title="In Progress"
            value={stats?.in_progress_complaints ?? 0}
            icon={Clock}
            color="blue"
            subtitle="Under active work"
            onClick={() => navigate('/admin/complaints?status=In+Progress')}
          />
          <StatsCard
            title="Resolved"
            value={stats?.resolved_complaints ?? 0}
            icon={CheckCircle2}
            color="emerald"
            subtitle="Completed tickets"
            onClick={() => navigate('/admin/complaints?status=Resolved')}
          />
        </div>

        {/* 4 Smart Analytics Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
          }}
        >
          <div className="glass-panel" style={{ padding: '18px 20px', borderTop: '3px solid var(--accent-cyan)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Avg Resolution Time</span>
              <Timer size={18} color="var(--accent-cyan)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>
              {stats?.avg_resolution_hours ?? 0} hrs
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              From submission to resolution
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px 20px', borderTop: '3px solid var(--accent-emerald)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Resolution Rate</span>
              <TrendingUp size={18} color="var(--accent-emerald)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>
              {stats?.resolution_rate ?? 0}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Resolved vs total complaints
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px 20px', borderTop: '3px solid var(--accent-rose)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Overdue Rate</span>
              <Flame size={18} color="var(--accent-rose)" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: (stats?.overdue_complaints ?? 0) > 0 ? '#fb7185' : '#ffffff' }}>
              {stats?.overdue_percentage ?? 0}%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {stats?.overdue_complaints ?? 0} overdue ticket{(stats?.overdue_complaints ?? 0) === 1 ? '' : 's'}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '18px 20px', borderTop: '3px solid #facc15' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Resident Satisfaction</span>
              <Star size={18} color="#facc15" fill="#facc15" />
            </div>
            <div style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff' }}>
              {stats?.avg_satisfaction_rating ? `${stats.avg_satisfaction_rating} / 5.0` : 'N/A'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Based on resident ratings
            </div>
          </div>
        </div>

        {/* 2-Column: Overdue Queue & Staff Workload */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px', marginBottom: '28px' }}>
          {/* Overdue Queue */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={18} color="var(--accent-rose)" />
                <h3 style={{ fontSize: '16px', color: '#ffffff', margin: 0 }}>
                  Critical Overdue Queue ({stats?.overdue_list?.length || 0})
                </h3>
              </div>
              <Link to="/admin/complaints?is_overdue=true" className="btn btn-secondary btn-sm">
                <span>View All</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>Loading...</div>
            ) : !stats?.overdue_list || stats.overdue_list.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={32} color="var(--accent-emerald)" style={{ margin: '0 auto 8px' }} />
                <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>Zero Overdue Complaints!</div>
                <div style={{ fontSize: '12px', marginTop: '2px' }}>All maintenance requests are operating within SLA deadlines.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.overdue_list.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate('/admin/complaints')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(244, 63, 94, 0.08)',
                      border: '1px solid rgba(244, 63, 94, 0.25)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', color: '#fb7185', fontWeight: '800' }}>#{item.id}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>&bull; {item.category}</span>
                        <SLACountdownBadge complaint={item} />
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </div>
                    </div>

                    <StatusBadge status={item.status} isOverdue={true} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Staff Workloads */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="var(--accent-indigo)" />
                <h3 style={{ fontSize: '16px', color: '#ffffff', margin: 0 }}>Staff Workload & Dispatch</h3>
              </div>
              <Link to="/admin/staff" className="btn btn-secondary btn-sm">
                <span>Manage Staff</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>Loading...</div>
            ) : !stats?.staff_workloads || stats.staff_workloads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-muted)' }}>
                No maintenance staff accounts configured.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.staff_workloads.map((st) => (
                  <div
                    key={st.staff_id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(13, 21, 39, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff' }}>
                        {st.staff_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#a78bfa', marginTop: '1px' }}>
                        {st.specialization}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: st.active_tickets > 0 ? '#fbbf24' : '#ffffff' }}>
                          {st.active_tickets} Active
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {st.resolved_tickets} Resolved
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown & Recent Logged Complaints */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Category Distribution */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={18} color="var(--accent-cyan)" />
                <h3 style={{ fontSize: '16px', color: '#ffffff', margin: 0 }}>Category Volume Breakdown</h3>
              </div>
              <Link to="/admin/categories" className="btn btn-secondary btn-sm">
                <span>Configure SLAs</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {stats?.category_counts && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {Object.entries(stats.category_counts).map(([cat, count]) => (
                  <div
                    key={cat}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(13, 21, 39, 0.6)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '13px'
                    }}
                  >
                    <span style={{ color: '#e2e8f0', fontWeight: '500' }}>{cat}</span>
                    <span
                      style={{
                        background: count > 0 ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                        color: count > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontWeight: '700'
                      }}
                    >
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Complaints */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '16px', color: '#ffffff', margin: 0 }}>Recent Registrations</h3>
              <Link to="/admin/complaints" className="btn btn-secondary btn-sm">
                <span>All Registry</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {stats?.recent_complaints && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.recent_complaints.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate('/admin/complaints')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(13, 21, 39, 0.6)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        #{item.id} &bull; {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                        {item.category} &bull; {formatDate(item.created_at)}
                      </div>
                    </div>

                    <StatusBadge status={item.status} isOverdue={item.is_overdue} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
