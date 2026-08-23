import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wrench,
  AlertCircle,
  Clock,
  CheckCircle2,
  ListOrdered,
  Flame,
  ArrowRight,
  RefreshCw,
  Bell
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { StatsCard } from '../../components/StatsCard';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SLACountdownBadge } from '../../components/SLACountdownBadge';
import { Modal } from '../../components/Modal';
import { Timeline } from '../../components/Timeline';
import { CommentsThread } from '../../components/CommentsThread';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Manage modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchStaffData = async () => {
    setLoading(true);
    try {
      const [complaintsData, noticesData] = await Promise.all([
        api.getStaffComplaints(),
        api.getNotices()
      ]);
      setComplaints(complaintsData);
      setNotices(noticesData);
    } catch (err) {
      console.error('Failed to load staff dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffData();
  }, []);

  const totalAssigned = complaints.length;
  const openCount = complaints.filter(c => c.status === 'Open').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const resolvedCount = complaints.filter(c => c.status === 'Resolved').length;
  const overdueCount = complaints.filter(c => c.is_overdue && c.status !== 'Resolved').length;

  const openManageModal = async (c) => {
    try {
      const detail = await api.getComplaint(c.id);
      setSelectedComplaint(detail);
      setNewStatus(detail.status);
      setActionNote('');
    } catch (err) {
      alert('Failed to load complaint details.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdating(true);

    try {
      await api.updateStaffComplaintStatus(selectedComplaint.id, newStatus, actionNote);
      setSelectedComplaint(null);
      fetchStaffData();
    } catch (err) {
      alert(err.message || 'Failed to update ticket.');
    } finally {
      setUpdating(false);
    }
  };

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
        title="Staff Workspace"
        subtitle={`Logged in as ${user?.full_name} (${user?.specialization || 'Maintenance Specialist'})`}
        extraAction={
          <button onClick={fetchStaffData} className="btn btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="page-body">
        {/* Overdue Alert Banner if any */}
        {overdueCount > 0 && (
          <div
            className="glass-panel"
            style={{
              padding: '16px 20px',
              marginBottom: '28px',
              borderLeft: '4px solid #f43f5e',
              background: 'linear-gradient(90deg, rgba(244, 63, 94, 0.15), rgba(13, 21, 39, 0.7))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Flame size={22} color="#fb7185" />
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>
                  🚨 You have {overdueCount} assigned ticket{overdueCount > 1 ? 's' : ''} past SLA deadline
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Please prioritize these overdue requests to restore compliance.
                </div>
              </div>
            </div>

            <Link to="/staff/my-assigned?is_overdue=true" className="btn btn-danger btn-sm">
              <span>Review Overdue</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

        {/* 4 KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            marginBottom: '32px'
          }}
        >
          <StatsCard
            title="Assigned Tickets"
            value={totalAssigned}
            icon={ListOrdered}
            color="indigo"
            subtitle="Assigned to your queue"
            onClick={() => navigate('/staff/my-assigned')}
          />
          <StatsCard
            title="Pending Dispatch"
            value={openCount}
            icon={AlertCircle}
            color="amber"
            subtitle="Action required"
            onClick={() => navigate('/staff/my-assigned?status=Open')}
          />
          <StatsCard
            title="In Progress"
            value={inProgressCount}
            icon={Clock}
            color="blue"
            subtitle="Under active work"
            onClick={() => navigate('/staff/my-assigned?status=In+Progress')}
          />
          <StatsCard
            title="Resolved by You"
            value={resolvedCount}
            icon={CheckCircle2}
            color="emerald"
            subtitle="Completed jobs"
            onClick={() => navigate('/staff/my-assigned?status=Resolved')}
          />
        </div>

        {/* Assigned Tickets Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '18px', color: '#ffffff', margin: 0 }}>My Active Queue</h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
                Operational maintenance jobs requiring your inspection and work
              </p>
            </div>

            <Link to="/staff/my-assigned" className="btn btn-secondary btn-sm">
              <span>View All Assigned</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              Loading assigned queue...
            </div>
          ) : complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <Wrench size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Queue is Clear!
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                No active complaints assigned to your account right now.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {complaints.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="glass-panel glass-panel-interactive"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    borderLeft: item.is_overdue && item.status !== 'Resolved' ? '4px solid #f43f5e' : '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: '700' }}>
                        #{item.id} &bull; {item.category}
                      </span>
                      {item.resident && (
                        <span style={{ fontSize: '12px', color: 'var(--accent-indigo)', fontWeight: '600' }}>
                          &bull; {item.resident.flat_number} ({item.resident.full_name})
                        </span>
                      )}
                      <SLACountdownBadge complaint={item} />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        &bull; {formatDate(item.created_at)}
                      </span>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', marginBottom: '2px' }}>
                      {item.title}
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.description}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                    <PriorityBadge priority={item.priority} />
                    <StatusBadge status={item.status} isOverdue={item.is_overdue} />
                    <button
                      onClick={() => openManageModal(item)}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '8px 14px' }}
                    >
                      Update Job
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Update Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Update Job: Complaint #${selectedComplaint.id}`}
          maxWidth="700px"
        >
          <div>
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '16px', color: '#ffffff', margin: '0 0 4px 0' }}>{selectedComplaint.title}</h4>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Resident: <strong>{selectedComplaint.resident?.full_name}</strong> &bull; Flat: <strong>{selectedComplaint.resident?.flat_number}</strong> &bull; Phone: <strong>{selectedComplaint.resident?.phone_number || 'N/A'}</strong>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(13, 21, 39, 0.7)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                color: 'var(--text-secondary)',
                lineHeight: '1.5',
                marginBottom: '20px'
              }}
            >
              {selectedComplaint.description}
            </div>

            <form onSubmit={handleUpdate}>
              <div className="input-group">
                <label className="input-label">Update Job Status</label>
                <select
                  className="select-field"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress (Work Underway)</option>
                  <option value="Resolved">Resolved (Job Completed)</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Operational Notes / Work Completed (Resident & Admin will be notified)</label>
                <textarea
                  className="textarea-field"
                  rows={3}
                  placeholder="e.g. Inspected valve and replaced rubber washer. Tested water pressure."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setSelectedComplaint(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={updating} className="btn btn-primary">
                  <span>{updating ? 'Saving...' : 'Save & Record Progress'}</span>
                </button>
              </div>
            </form>

            {/* Comments Thread inside modal */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <CommentsThread complaintId={selectedComplaint.id} initialComments={selectedComplaint.comments} />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
