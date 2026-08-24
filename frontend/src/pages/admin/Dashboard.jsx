import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  ListOrdered,
  Flame,
  TrendingUp,
  Timer,
  Star,
  Users,
  Layers,
  ArrowRight,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { api } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { StatsCard } from '../../components/StatsCard';
import { StatusBadge } from '../../components/StatusBadge';
import { SLACountdownBadge } from '../../components/SLACountdownBadge';
import { AnimatedNumber } from '../../components/AnimatedNumber';
import { SkeletonStatsCard, SkeletonListRow } from '../../components/Skeleton';
import { useToast } from '../../context/ToastContext';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await api.getDashboardStats();
      setStats(data);
      if (isManual) {
        toast.success('Dashboard updated', 'Live metrics refreshed successfully.');
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      if (isManual) toast.error('Refresh failed', 'Could not retrieve latest stats.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
        title="Admin Dashboard & Smart Analytics"
        subtitle="Live society maintenance health, technician workloads, SLA compliance, and recurring patterns"
        extraAction={
          <button
            onClick={() => fetchStats(true)}
            className="btn btn-secondary btn-sm"
            disabled={loading || refreshing}
          >
            <RefreshCw size={13} className={refreshing ? 'spin-once' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        }
      />

      <div className="page-body">
        {/* Recurring Issues Banner if detected */}
        {stats?.recurring_issues && stats.recurring_issues.length > 0 && (
          <div
            className="stagger-1"
            style={{
              padding: '14px 18px',
              marginBottom: '20px',
              borderLeft: '4px solid #E5A83B',
              background: '#FDF6E9',
              borderRadius: '10px',
              border: '1px solid #F8E3BC',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '14px',
              flexWrap: 'wrap',
              boxShadow: '0 2px 8px rgba(229, 168, 59, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} color="#E5A83B" style={{ flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400E' }}>
                  {stats.recurring_issues.length} Recurring Issue Pattern{stats.recurring_issues.length > 1 ? 's' : ''} Detected (Past 30 Days)
                </div>
                <div style={{ fontSize: '12px', color: '#78350F' }}>
                  {stats.recurring_issues[0].category} issues clustered around {stats.recurring_issues[0].location} ({stats.recurring_issues[0].complaint_count} incidents).
                </div>
              </div>
            </div>

            <Link to="/admin/complaints" className="btn btn-secondary btn-sm" style={{ padding: '5px 10px', fontSize: '12px' }}>
              <span>Inspect Clusters</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* 4 Primary KPI Cards */}
        {loading && !stats ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}
          >
            <SkeletonStatsCard />
            <SkeletonStatsCard />
            <SkeletonStatsCard />
            <SkeletonStatsCard />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '20px'
            }}
          >
            <StatsCard
              title="Total Complaints"
              value={stats?.total_complaints ?? 0}
              icon={ListOrdered}
              color="coral"
              subtitle="All logged records"
              staggerClass="stagger-1"
              onClick={() => navigate('/admin/complaints')}
            />
            <StatsCard
              title="Open Tickets"
              value={stats?.open_complaints ?? 0}
              icon={AlertCircle}
              color="coral"
              subtitle="Awaiting action"
              staggerClass="stagger-2"
              onClick={() => navigate('/admin/complaints?status=Open')}
            />
            <StatsCard
              title="In Progress"
              value={stats?.in_progress_complaints ?? 0}
              icon={Clock}
              color="amber"
              subtitle="Under active work"
              staggerClass="stagger-3"
              onClick={() => navigate('/admin/complaints?status=In+Progress')}
            />
            <StatsCard
              title="Resolved"
              value={stats?.resolved_complaints ?? 0}
              icon={CheckCircle2}
              color="emerald"
              subtitle="Completed tickets"
              staggerClass="stagger-4"
              onClick={() => navigate('/admin/complaints?status=Resolved')}
            />
          </div>
        )}

        {/* 4 Smart Analytics Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          <div
            className="stagger-2 interactive-card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E9',
              borderRadius: '12px',
              padding: '16px 20px',
              borderTop: '3px solid #F04B4F',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Avg Resolution</span>
              <Timer size={16} color="#F04B4F" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#222222' }}>
              <AnimatedNumber value={stats?.avg_resolution_hours ?? 0} suffix=" hrs" />
            </div>
            <div style={{ fontSize: '11px', color: '#777777', marginTop: '2px' }}>
              Submission to closure
            </div>
          </div>

          <div
            className="stagger-3 interactive-card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E9',
              borderRadius: '12px',
              padding: '16px 20px',
              borderTop: '3px solid #46B878',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Resolution Rate</span>
              <TrendingUp size={16} color="#46B878" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#222222' }}>
              <AnimatedNumber value={stats?.resolution_rate ?? 0} suffix="%" />
            </div>
            <div style={{ fontSize: '11px', color: '#777777', marginTop: '2px' }}>
              Resolved vs total
            </div>
          </div>

          <div
            className={`stagger-4 interactive-card ${(stats?.overdue_complaints ?? 0) > 0 ? 'overdue-border-pulse' : ''}`}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E9',
              borderRadius: '12px',
              padding: '16px 20px',
              borderTop: '3px solid #F04B4F',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Overdue Rate</span>
              <Flame size={16} color="#F04B4F" className={(stats?.overdue_complaints ?? 0) > 0 ? 'overdue-pulse' : ''} />
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: (stats?.overdue_complaints ?? 0) > 0 ? '#F04B4F' : '#222222' }}>
              <AnimatedNumber value={stats?.overdue_percentage ?? 0} suffix="%" />
            </div>
            <div style={{ fontSize: '11px', color: '#777777', marginTop: '2px' }}>
              {stats?.overdue_complaints ?? 0} overdue ticket{(stats?.overdue_complaints ?? 0) === 1 ? '' : 's'}
            </div>
          </div>

          <div
            className="stagger-5 interactive-card"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E9',
              borderRadius: '12px',
              padding: '16px 20px',
              borderTop: '3px solid #E5A83B',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              transition: 'transform 0.25s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.25s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '0.04em' }}>Satisfaction</span>
              <Star size={16} color="#E5A83B" fill="#E5A83B" />
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#222222' }}>
              {stats?.avg_satisfaction_rating ? (
                <AnimatedNumber value={stats.avg_satisfaction_rating} decimals={1} suffix=" / 5.0" />
              ) : (
                'N/A'
              )}
            </div>
            <div style={{ fontSize: '11px', color: '#777777', marginTop: '2px' }}>
              Resident feedback ratings
            </div>
          </div>
        </div>

        {/* 2-Column: Overdue Queue & Staff Workload */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', marginBottom: '24px' }}>
          {/* Overdue Queue */}
          <div
            className="stagger-5"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E9',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={16} color="#F04B4F" className={(stats?.overdue_list?.length || 0) > 0 ? 'overdue-pulse' : ''} />
                <h3 style={{ fontSize: '15px', color: '#222222', margin: 0, fontWeight: '700' }}>
                  Critical Overdue Queue ({stats?.overdue_list?.length || 0})
                </h3>
              </div>
              <Link to="/admin/complaints?is_overdue=true" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }}>
                <span>View All</span>
                <ArrowRight size={11} />
              </Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SkeletonListRow />
                <SkeletonListRow />
              </div>
            ) : !stats?.overdue_list || stats.overdue_list.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 16px', color: '#777777' }}>
                <CheckCircle2 size={28} color="#46B878" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: '13px', color: '#222222', fontWeight: '600' }}>Zero Overdue Complaints!</div>
                <div style={{ fontSize: '11px', marginTop: '2px', color: '#A0A0A0' }}>All requests are operating within SLA windows.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.overdue_list.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => navigate('/admin/complaints')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#FCECED',
                      border: '1px solid #F9D0D2',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      transition: 'transform 0.18s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.18s',
                      animation: `itemSlideRight 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.05}s both`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1.5px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(240, 75, 79, 0.12)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '11px', color: '#F04B4F', fontWeight: '800' }}>#{item.id}</span>
                        <span style={{ fontSize: '11px', color: '#777777' }}>&bull; {item.category}</span>
                        <SLACountdownBadge complaint={item} />
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#222222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
          <div
            className="stagger-6"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E9',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={16} color="#F04B4F" />
                <h3 style={{ fontSize: '15px', color: '#222222', margin: 0, fontWeight: '700' }}>Staff Workload</h3>
              </div>
              <Link to="/admin/staff" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }}>
                <span>Manage Staff</span>
                <ArrowRight size={11} />
              </Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <SkeletonListRow />
                <SkeletonListRow />
              </div>
            ) : !stats?.staff_workloads || stats.staff_workloads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 16px', color: '#777777', fontSize: '12px' }}>
                No maintenance staff configured.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stats.staff_workloads.map((st, idx) => (
                  <div
                    key={st.staff_id}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: '#FFFFFF',
                      border: '1px solid #E7E7E9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      transition: 'border-color 0.15s, transform 0.15s',
                      animation: `itemSlideRight 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.04}s both`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#D5D5D8';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E7E7E9';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#222222' }}>
                        {st.staff_name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#777777', marginTop: '1px' }}>
                        {st.specialization}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: st.active_tickets > 0 ? '#E5A83B' : '#46B878' }}>
                        <AnimatedNumber value={st.active_tickets} suffix=" Active" />
                      </div>
                      <div style={{ fontSize: '10px', color: '#A0A0A0' }}>
                        <AnimatedNumber value={st.resolved_tickets} suffix=" Resolved" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown & Recent Logged Complaints */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Category Distribution */}
          <div
            className="stagger-7"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E9',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Layers size={16} color="#F04B4F" />
                <h3 style={{ fontSize: '15px', color: '#222222', margin: 0, fontWeight: '700' }}>Category Breakdown</h3>
              </div>
              <Link to="/admin/categories" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }}>
                <span>SLAs</span>
                <ArrowRight size={11} />
              </Link>
            </div>

            {stats?.category_counts && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {Object.entries(stats.category_counts).map(([cat, count], idx) => (
                  <div
                    key={cat}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#FFFFFF',
                      border: '1px solid #E7E7E9',
                      borderRadius: '6px',
                      fontSize: '12px',
                      transition: 'border-color 0.15s, transform 0.15s',
                      animation: `itemSlideRight 0.3s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.03}s both`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#D5D5D8';
                      e.currentTarget.style.transform = 'translateX(2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E7E7E9';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <span style={{ color: '#222222', fontWeight: '500' }}>{cat}</span>
                    <span
                      className="badge-pop"
                      style={{
                        background: count > 0 ? '#FCECED' : '#F3F4F6',
                        color: count > 0 ? '#F04B4F' : '#777777',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: '700'
                      }}
                    >
                      <AnimatedNumber value={count} />
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Complaints */}
          <div
            className="stagger-8"
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7E7E9',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '15px', color: '#222222', margin: 0, fontWeight: '700' }}>Recent Registrations</h3>
              <Link to="/admin/complaints" className="btn btn-secondary btn-sm" style={{ padding: '4px 8px', fontSize: '11px' }}>
                <span>All Registry</span>
                <ArrowRight size={11} />
              </Link>
            </div>

            {stats?.recent_complaints && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {stats.recent_complaints.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => navigate('/admin/complaints')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      background: '#FFFFFF',
                      border: '1px solid #E7E7E9',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s, border-color 0.15s, transform 0.15s',
                      animation: `itemSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.04}s both`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#FAFAFA';
                      e.currentTarget.style.borderColor = '#D5D5D8';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#E7E7E9';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#222222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        #{item.id} &bull; {item.title}
                      </div>
                      <div style={{ fontSize: '11px', color: '#777777', marginTop: '1px' }}>
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
