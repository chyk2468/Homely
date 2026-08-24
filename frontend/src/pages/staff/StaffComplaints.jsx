import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Wrench, RefreshCw, Phone, Check } from 'lucide-react';
import { api, API_ROOT } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SLACountdownBadge } from '../../components/SLACountdownBadge';
import { Modal } from '../../components/Modal';
import { CommentsThread } from '../../components/CommentsThread';
import { SkeletonListRow } from '../../components/Skeleton';
import { useToast } from '../../context/ToastContext';

export const StaffComplaints = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [isOverdueFilter, setIsOverdueFilter] = useState(searchParams.get('is_overdue') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Detail / Update Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const fetchAssigned = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (isOverdueFilter) params.is_overdue = isOverdueFilter === 'true';
      if (searchQuery) params.search = searchQuery;

      const data = await api.getStaffComplaints(params);
      setComplaints(data);
      if (isManual) {
        toast.success('Queue refreshed', 'Fetched matching assigned tickets.');
      }
    } catch (err) {
      console.error('Failed to load assigned complaints:', err);
      if (isManual) toast.error('Refresh failed', 'Could not load assigned tickets.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAssigned();
  }, [statusFilter, priorityFilter, isOverdueFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAssigned();
  };

  const openComplaintModal = async (c) => {
    try {
      const detail = await api.getComplaint(c.id);
      setSelectedComplaint(detail);
      setNewStatus(detail.status);
      setActionNote('');
      setUpdateSuccess(false);
    } catch {
      toast.error('Load failed', 'Could not load complaint details.');
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdating(true);

    try {
      await api.updateStaffComplaintStatus(selectedComplaint.id, newStatus, actionNote);
      setUpdating(false);
      setUpdateSuccess(true);
      toast.success('Ticket updated', `Complaint #${selectedComplaint.id} set to "${newStatus}".`);

      setTimeout(() => {
        setSelectedComplaint(null);
        fetchAssigned();
      }, 700);
    } catch (err) {
      setUpdating(false);
      toast.error('Update failed', err.message || 'Failed to update ticket status.');
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
        title="Assigned Complaints Queue"
        subtitle="Manage your maintenance assignments, update progress, and resolve work orders"
        extraAction={
          <button
            onClick={() => fetchAssigned(true)}
            className="btn btn-secondary btn-sm"
            disabled={loading || refreshing}
          >
            <RefreshCw size={13} className={refreshing ? 'spin-once' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        }
      />

      <div className="page-body">
        {/* Filter Bar */}
        <div
          className="stagger-1"
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E7E7E9',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '20px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
          }}
        >
          <form onSubmit={handleSearchSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
              {/* Search */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Search</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="ID, title, resident..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '30px', fontSize: '12px' }}
                  />
                  <Search size={14} style={{ position: 'absolute', left: '9px', top: '11px', color: '#A0A0A0' }} />
                </div>
              </div>

              {/* Status */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Status</label>
                <select
                  className="select-field"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ fontSize: '12px' }}
                >
                  <option value="">All Statuses</option>
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              {/* Priority */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Priority</label>
                <select
                  className="select-field"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  style={{ fontSize: '12px' }}
                >
                  <option value="">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              {/* Overdue */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">SLA Compliance</label>
                <select
                  className="select-field"
                  value={isOverdueFilter}
                  onChange={(e) => setIsOverdueFilter(e.target.value)}
                  style={{ fontSize: '12px' }}
                >
                  <option value="">All Tickets</option>
                  <option value="true">Overdue Only</option>
                  <option value="false">Within SLA</option>
                </select>
              </div>

              {/* Search button */}
              <button type="submit" className="btn btn-primary" style={{ padding: '9px 16px', fontSize: '13px' }}>
                <Search size={14} />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>

        {/* Complaints Table / List */}
        <div
          className="stagger-2"
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
              Assigned Tickets ({complaints.length})
            </h2>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SkeletonListRow />
              <SkeletonListRow />
              <SkeletonListRow />
            </div>
          ) : complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', animation: 'scalePopIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}>
              <Wrench size={36} color="#A0A0A0" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ fontSize: '15px', color: '#222222', marginBottom: '4px' }}>
                No Matching Complaints
              </h3>
              <p style={{ fontSize: '13px', color: '#777777' }}>
                Try adjusting your search criteria or filter tags.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {complaints.map((c, idx) => (
                <div
                  key={c.id}
                  style={{
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    borderRadius: '10px',
                    border: '1px solid #E7E7E9',
                    borderLeft: c.is_overdue && c.status !== 'Resolved' ? '4px solid #F04B4F' : '1px solid #E7E7E9',
                    backgroundColor: '#FFFFFF',
                    transition: 'background-color 0.15s, border-color 0.15s, transform 0.15s',
                    animation: `itemSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.03}s both`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FAFAFA';
                    e.currentTarget.style.borderColor = '#D5D5D8';
                    e.currentTarget.style.transform = 'translateY(-1.5px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#E7E7E9';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: '#F04B4F' }}>
                        #{c.id}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          background: '#F3F4F6',
                          color: '#777777',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}
                      >
                        {c.category}
                      </span>
                      {c.resident && (
                        <span style={{ fontSize: '12px', color: '#222222', fontWeight: '600' }}>
                          &bull; {c.resident.flat_number} ({c.resident.full_name})
                        </span>
                      )}
                      <SLACountdownBadge complaint={c} />
                      <span style={{ fontSize: '11px', color: '#A0A0A0' }}>
                        &bull; {formatDate(c.created_at)}
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#222222', marginBottom: '2px' }}>
                      {c.title}
                    </div>

                    <div style={{ fontSize: '12px', color: '#777777', lineHeight: '1.4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.description}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} isOverdue={c.is_overdue} />
                    <button
                      onClick={() => openComplaintModal(c)}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                      <span>Manage</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Staff Update / Detail Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Ticket #${selectedComplaint.id}: ${selectedComplaint.title}`}
          maxWidth="700px"
        >
          <div>
            {/* Resident contact card */}
            <div
              style={{
                background: '#F7F7F8',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #E7E7E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase' }}>Resident Details</div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#222222', marginTop: '2px' }}>
                  {selectedComplaint.resident?.full_name} &bull; {selectedComplaint.resident?.flat_number}
                </div>
              </div>

              {selectedComplaint.resident?.phone_number && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#F04B4F', fontWeight: '600' }}>
                  <Phone size={13} />
                  <span>{selectedComplaint.resident.phone_number}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase', marginBottom: '4px', fontWeight: '600' }}>
                Description
              </div>
              <div style={{ background: '#F7F7F8', padding: '12px', borderRadius: '6px', color: '#222222', fontSize: '13px', lineHeight: '1.4', whiteSpace: 'pre-wrap', border: '1px solid #E7E7E9' }}>
                {selectedComplaint.description}
              </div>
            </div>

            {/* Attachments */}
            {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600' }}>
                  Attachments ({selectedComplaint.attachments.length})
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {selectedComplaint.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={`${API_ROOT}${att.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        width: '100px',
                        height: '70px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        border: '1px solid #E7E7E9',
                        transition: 'transform 0.18s, box-shadow 0.18s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.04)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <img
                        src={`${API_ROOT}${att.file_path}`}
                        alt="attachment"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Update Form */}
            <form onSubmit={handleStatusSubmit} style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #E7E7E9' }}>
              <div className="input-group">
                <label className="input-label">Update Ticket Status</label>
                <select
                  className="select-field"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="Open">Open</option>
                  <option value="In Progress">In Progress (Active On-Site)</option>
                  <option value="Resolved">Resolved (Work Completed)</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Maintenance Notes & Remarks</label>
                <textarea
                  className="textarea-field"
                  rows={2}
                  placeholder="Record work details for resident & society records..."
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setSelectedComplaint(null)} className="btn btn-secondary">
                  Close
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
                  <span>{updating ? 'Saving...' : updateSuccess ? 'Saved' : 'Save Status Update'}</span>
                </button>
              </div>
            </form>

            {/* Discussion Thread */}
            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #E7E7E9' }}>
              <CommentsThread complaintId={selectedComplaint.id} initialComments={selectedComplaint.comments} />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
