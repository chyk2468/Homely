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
  Check
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from '../../components/Navbar';
import { StatsCard } from '../../components/StatsCard';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SLACountdownBadge } from '../../components/SLACountdownBadge';
import { Modal } from '../../components/Modal';
import { CommentsThread } from '../../components/CommentsThread';
import { SkeletonStatsCard, SkeletonListRow } from '../../components/Skeleton';
import { useToast } from '../../context/ToastContext';

export const StaffDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Manage modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const fetchStaffData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const complaintsData = await api.getStaffComplaints();
      setComplaints(complaintsData);
      if (isManual) {
        toast.success('Queue refreshed', 'Latest assigned complaints retrieved.');
      }
    } catch (err) {
      console.error('Failed to load staff dashboard:', err);
      if (isManual) toast.error('Refresh failed', 'Could not refresh assigned complaints.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      setUpdateSuccess(false);
    } catch {
      toast.error('Load failed', 'Could not load job details.');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdating(true);

    try {
      await api.updateStaffComplaintStatus(selectedComplaint.id, newStatus, actionNote);
      setUpdating(false);
      setUpdateSuccess(true);
      toast.success('Job updated', `Status changed to "${newStatus}".`);

      setTimeout(() => {
        setSelectedComplaint(null);
        fetchStaffData();
      }, 700);
    } catch (err) {
      setUpdating(false);
      toast.error('Update failed', err.message || 'Failed to update ticket.');
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
          <button
            onClick={() => fetchStaffData(true)}
            className="btn btn-secondary btn-sm"
            disabled={loading || refreshing}
          >
            <RefreshCw size={13} className={refreshing ? 'spin-once' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        }
      />

      <div className="page-body">
        {/* Overdue Alert Banner if any */}
        {overdueCount > 0 && (
          <div
            className="stagger-1"
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
              gap: '16px',
              boxShadow: '0 2px 8px rgba(240, 75, 79, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Flame size={20} color="#F04B4F" className="overdue-pulse" />
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#F04B4F' }}>
                  {overdueCount} Assigned Ticket{overdueCount > 1 ? 's' : ''} Overdue
                </div>
                <div style={{ fontSize: '12px', color: '#777777' }}>
                  Please prioritize overdue requests to meet society SLA compliance.
                </div>
              </div>
            </div>

            <Link to="/staff/my-assigned?is_overdue=true" className="btn btn-danger btn-sm" style={{ padding: '5px 10px', fontSize: '12px' }}>
              <span>Review Overdue</span>
              <ArrowRight size={12} />
            </Link>
          </div>
        )}

        {/* 4 KPI Cards */}
        {loading && complaints.length === 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
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
              marginBottom: '24px'
            }}
          >
            <StatsCard
              title="Assigned Tickets"
              value={totalAssigned}
              icon={ListOrdered}
              color="coral"
              subtitle="Your active queue"
              staggerClass="stagger-1"
              onClick={() => navigate('/staff/my-assigned')}
            />
            <StatsCard
              title="Pending Dispatch"
              value={openCount}
              icon={AlertCircle}
              color="coral"
              subtitle="Action required"
              staggerClass="stagger-2"
              onClick={() => navigate('/staff/my-assigned?status=Open')}
            />
            <StatsCard
              title="In Progress"
              value={inProgressCount}
              icon={Clock}
              color="amber"
              subtitle="Work underway"
              staggerClass="stagger-3"
              onClick={() => navigate('/staff/my-assigned?status=In+Progress')}
            />
            <StatsCard
              title="Resolved by You"
              value={resolvedCount}
              icon={CheckCircle2}
              color="emerald"
              subtitle="Completed jobs"
              staggerClass="stagger-4"
              onClick={() => navigate('/staff/my-assigned?status=Resolved')}
            />
          </div>
        )}

        {/* Assigned Tickets Section */}
        <div
          className="stagger-3"
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
              <h2 style={{ fontSize: '16px', color: '#222222', margin: 0, fontWeight: '700' }}>My Assigned Queue</h2>
              <p style={{ fontSize: '12px', color: '#777777', margin: '2px 0 0 0' }}>
                Maintenance work orders requiring inspection and service
              </p>
            </div>

            <Link to="/staff/my-assigned" className="btn btn-secondary btn-sm">
              <span>View All</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SkeletonListRow />
              <SkeletonListRow />
            </div>
          ) : complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', animation: 'scalePopIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}>
              <Wrench size={32} color="#A0A0A0" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '15px', color: '#222222', marginBottom: '4px' }}>
                Queue is Clear!
              </h3>
              <p style={{ fontSize: '13px', color: '#777777' }}>
                No active complaints assigned to your account right now.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {complaints.slice(0, 6).map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    borderRadius: '10px',
                    border: '1px solid #E7E7E9',
                    borderLeft: item.is_overdue && item.status !== 'Resolved' ? '4px solid #F04B4F' : '1px solid #E7E7E9',
                    backgroundColor: '#FFFFFF',
                    transition: 'background-color 0.15s, border-color 0.15s, transform 0.15s',
                    animation: `itemSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.03}s both`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FAFAFA';
                    e.currentTarget.style.transform = 'translateY(-1.5px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <span style={{ fontSize: '12px', color: '#F04B4F', fontWeight: '700' }}>
                        #{item.id} &bull; {item.category}
                      </span>
                      {item.resident && (
                        <span style={{ fontSize: '12px', color: '#222222', fontWeight: '600' }}>
                          &bull; {item.resident.flat_number} ({item.resident.full_name})
                        </span>
                      )}
                      <SLACountdownBadge complaint={item} />
                      <span style={{ fontSize: '11px', color: '#A0A0A0' }}>
                        &bull; {formatDate(item.created_at)}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#222222', marginBottom: '2px' }}>
                      {item.title}
                    </div>

                    <div style={{ fontSize: '12px', color: '#777777', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.description}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <PriorityBadge priority={item.priority} />
                    <StatusBadge status={item.status} isOverdue={item.is_overdue} />
                    <button
                      onClick={() => openManageModal(item)}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
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
          maxWidth="640px"
        >
          <div>
            <div style={{ marginBottom: '14px' }}>
              <h4 style={{ fontSize: '15px', color: '#222222', margin: '0 0 2px 0', fontWeight: '700' }}>{selectedComplaint.title}</h4>
              <div style={{ fontSize: '12px', color: '#777777' }}>
                Resident: <strong>{selectedComplaint.resident?.full_name}</strong> &bull; Flat: <strong>{selectedComplaint.resident?.flat_number}</strong> &bull; Phone: <strong>{selectedComplaint.resident?.phone_number || 'N/A'}</strong>
              </div>
            </div>

            <div
              style={{
                backgroundColor: '#F7F7F8',
                padding: '12px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#444444',
                lineHeight: '1.5',
                marginBottom: '16px',
                border: '1px solid #E7E7E9'
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
                <label className="input-label">Operational Notes / Work Done</label>
                <textarea
                  className="textarea-field"
                  rows={3}
                  placeholder="e.g. Replaced leaking valve gasket. Tested water flow."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setSelectedComplaint(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating || updateSuccess}
                  className={`btn ${updateSuccess ? 'btn-success' : 'btn-primary'}`}
                >
                  {updating ? (
                    <span className="btn-spinner" style={{ width: '13px', height: '13px' }} />
                  ) : updateSuccess ? (
                    <Check size={14} className="btn-checkmark-icon" />
                  ) : null}
                  <span>{updating ? 'Saving...' : updateSuccess ? 'Recorded!' : 'Save & Record Progress'}</span>
                </button>
              </div>
            </form>

            {/* Comments Thread inside modal */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E7E7E9' }}>
              <CommentsThread complaintId={selectedComplaint.id} initialComments={selectedComplaint.comments} />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
