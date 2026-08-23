import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  ListOrdered,
  AlertCircle,
  Clock,
  CheckCircle2,
  Bell,
  ArrowRight,
  Sparkles,
  Building
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { StatsCard } from '../../components/StatsCard';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SLACountdownBadge } from '../../components/SLACountdownBadge';

export const ResidentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [complaintsData, noticesData] = await Promise.all([
          api.getComplaints(),
          api.getNotices()
        ]);
        setComplaints(complaintsData);
        setNotices(noticesData);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const total = complaints.length;
  const openCount = complaints.filter(c => c.status === 'Open').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;

  const importantNotice = notices.find(n => n.is_important);

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
        title="Resident Portal"
        subtitle={`Welcome back, ${user?.full_name || 'Resident'} (${user?.flat_number || 'Unit'})`}
        extraAction={
          <Link to="/resident/new-complaint" className="btn btn-primary btn-sm">
            <PlusCircle size={15} />
            <span>Raise Complaint</span>
          </Link>
        }
      />

      <div className="page-body">
        {/* Important Announcement Banner if any */}
        {importantNotice && (
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              marginBottom: '28px',
              borderLeft: '4px solid var(--accent-rose)',
              background: 'linear-gradient(90deg, rgba(244, 63, 94, 0.12), rgba(13, 21, 39, 0.6))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(244, 63, 94, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fb7185',
                  flexShrink: 0
                }}
              >
                <Bell size={18} />
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#fb7185', textTransform: 'uppercase' }}>
                  Important Notice
                </div>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                  {importantNotice.title}
                </div>
              </div>
            </div>

            <Link to="/notices" className="btn btn-secondary btn-sm" style={{ flexShrink: 0 }}>
              <span>View Notice</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}
        >
          <StatsCard
            title="Total Complaints"
            value={total}
            icon={ListOrdered}
            color="indigo"
            subtitle="Raised by your unit"
            onClick={() => navigate('/resident/my-complaints')}
          />
          <StatsCard
            title="Open / Pending"
            value={openCount}
            icon={AlertCircle}
            color="amber"
            subtitle="Awaiting admin action"
            onClick={() => navigate('/resident/my-complaints?status=Open')}
          />
          <StatsCard
            title="In Progress"
            value={inProgressCount}
            icon={Clock}
            color="blue"
            subtitle="Work in progress"
            onClick={() => navigate('/resident/my-complaints?status=In+Progress')}
          />
          <StatsCard
            title="Resolved"
            value={resolvedCount}
            icon={CheckCircle2}
            color="emerald"
            subtitle="Successfully closed"
            onClick={() => navigate('/resident/my-complaints?status=Resolved')}
          />
        </div>

        {/* Recent Complaints Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', color: '#ffffff', margin: 0 }}>My Recent Complaints</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Track maintenance status and administrator notes in real-time
              </p>
            </div>

            <Link to="/resident/my-complaints" className="btn btn-secondary btn-sm">
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Loading complaints...
            </div>
          ) : complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <Building size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                No Complaints Raised Yet
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                Everything in your unit is operating smoothly! Need maintenance assistance?
              </p>
              <Link to="/resident/new-complaint" className="btn btn-primary btn-sm">
                <PlusCircle size={15} />
                <span>Raise a Complaint</span>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {complaints.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/resident/complaints/${item.id}`)}
                  className="glass-panel glass-panel-interactive"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: '600' }}>
                        #{item.id} &bull; {item.category}
                      </span>
                      <SLACountdownBadge complaint={item} />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        &bull; {formatDate(item.created_at)}
                      </span>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <PriorityBadge priority={item.priority} />
                    <StatusBadge status={item.status} isOverdue={item.is_overdue} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
