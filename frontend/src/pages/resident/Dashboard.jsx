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
            <PlusCircle size={14} />
            <span>Raise Complaint</span>
          </Link>
        }
      />

      <div className="page-body">
        {/* Important Announcement Banner if any */}
        {importantNotice && (
          <div
            style={{
              padding: '14px 18px',
              marginBottom: '20px',
              borderLeft: '4px solid #F04B4F',
              background: '#FCECED',
              borderRadius: '10px',
              border: '1px solid #F9D0D2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#F04B4F',
                  flexShrink: 0
                }}
              >
                <Bell size={16} />
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: '#F04B4F', textTransform: 'uppercase' }}>
                  Important Notice
                </div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: '#222222' }}>
                  {importantNotice.title}
                </div>
              </div>
            </div>

            <Link to="/notices" className="btn btn-secondary btn-sm" style={{ flexShrink: 0, padding: '5px 10px', fontSize: '12px' }}>
              <span>View</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}
        >
          <StatsCard
            title="Total Complaints"
            value={total}
            icon={ListOrdered}
            color="coral"
            subtitle="Raised by your unit"
            onClick={() => navigate('/resident/my-complaints')}
          />
          <StatsCard
            title="Open / Pending"
            value={openCount}
            icon={AlertCircle}
            color="coral"
            subtitle="Awaiting action"
            onClick={() => navigate('/resident/my-complaints?status=Open')}
          />
          <StatsCard
            title="In Progress"
            value={inProgressCount}
            icon={Clock}
            color="amber"
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
            <div>
              <h2 style={{ fontSize: '16px', color: '#222222', margin: 0, fontWeight: '700' }}>Recent Complaints</h2>
              <p style={{ fontSize: '12px', color: '#777777', margin: '2px 0 0 0' }}>
                Track maintenance status and progress notes in real-time
              </p>
            </div>

            <Link to="/resident/my-complaints" className="btn btn-secondary btn-sm">
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#777777', fontSize: '13px' }}>
              Loading complaints...
            </div>
          ) : complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px' }}>
              <Building size={32} color="#A0A0A0" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '15px', color: '#222222', marginBottom: '4px' }}>
                No Complaints Raised Yet
              </h3>
              <p style={{ fontSize: '13px', color: '#777777', marginBottom: '16px' }}>
                Everything in your unit is operating smoothly! Need maintenance assistance?
              </p>
              <Link to="/resident/new-complaint" className="btn btn-primary btn-sm">
                <PlusCircle size={14} />
                <span>Raise a Complaint</span>
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {complaints.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/resident/complaints/${item.id}`)}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    border: '1px solid #E7E7E9',
                    backgroundColor: '#FFFFFF',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FAFAFA';
                    e.currentTarget.style.borderColor = '#D5D5D8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#E7E7E9';
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <span style={{ fontSize: '12px', color: '#F04B4F', fontWeight: '700' }}>
                        #{item.id}
                      </span>
                      <span style={{ fontSize: '12px', color: '#777777' }}>
                        &bull; {item.category}
                      </span>
                      <SLACountdownBadge complaint={item} />
                      <span style={{ fontSize: '11px', color: '#A0A0A0' }}>
                        &bull; {formatDate(item.created_at)}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#222222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.title}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
