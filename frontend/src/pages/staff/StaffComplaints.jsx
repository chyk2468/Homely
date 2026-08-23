import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Wrench, RefreshCw, AlertCircle, Eye, Clock, User, Phone } from 'lucide-react';
import { api, API_ROOT } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SLACountdownBadge } from '../../components/SLACountdownBadge';
import { Modal } from '../../components/Modal';
import { CommentsThread } from '../../components/CommentsThread';
import { Timeline } from '../../components/Timeline';

export const StaffComplaints = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const fetchAssigned = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (isOverdueFilter) params.is_overdue = isOverdueFilter === 'true';
      if (searchQuery) params.search = searchQuery;

      const data = await api.getStaffComplaints(params);
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load assigned complaints:', err);
    } finally {
      setLoading(false);
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
    } catch (err) {
      alert('Failed to load complaint details.');
    }
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdating(true);

    try {
      await api.updateStaffComplaintStatus(selectedComplaint.id, newStatus, actionNote);
      setSelectedComplaint(null);
      fetchAssigned();
    } catch (err) {
      alert(err.message || 'Failed to update ticket status.');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (isoString) => {
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <>
      <Navbar
        title="Assigned Complaints Queue"
        subtitle="Manage your maintenance assignments, record updates, and resolve service tickets"
        extraAction={
          <button onClick={fetchAssigned} className="btn btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        }
      />

      <div className="page-body">
        {/* Filter Bar */}
        <div className="glass-panel" style={{ padding: '18px 24px', marginBottom: '24px' }}>
          <form onSubmit={handleSearchSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', alignItems: 'flex-end' }}>
              {/* Search */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Search</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Search ID, title, flat, resident..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '34px' }}
                  />
                  <Search size={15} style={{ position: 'absolute', left: '11px', top: '12px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              {/* Status */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Status</label>
                <select
                  className="select-field"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
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
                >
                  <option value="">All Priorities</option>
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>

              {/* Overdue */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">SLA Compliance</label>
                <select
                  className="select-field"
                  value={isOverdueFilter}
                  onChange={(e) => setIsOverdueFilter(e.target.value)}
                >
                  <option value="">All Tickets</option>
                  <option value="true">🚨 Overdue Only</option>
                  <option value="false">✅ Within SLA</option>
                </select>
              </div>

              {/* Search button */}
              <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
                <Search size={15} />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>

        {/* Complaints Table / List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '16px', color: '#ffffff', margin: 0 }}>
              Assigned Tickets ({complaints.length})
            </h2>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              Filtering assigned complaints...
            </div>
          ) : complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px' }}>
              <Wrench size={40} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                No Matching Complaints
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Try adjusting your search criteria or filter tags.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="glass-panel glass-panel-interactive"
                  style={{
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    borderLeft: c.is_overdue && c.status !== 'Resolved' ? '4px solid #f43f5e' : '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                        #{c.id}
                      </span>
                      <span
                        style={{
                          fontSize: '11px',
                          background: 'rgba(6, 182, 212, 0.15)',
                          color: 'var(--accent-cyan)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontWeight: '600'
                        }}
                      >
                        {c.category}
                      </span>
                      {c.resident && (
                        <span style={{ fontSize: '12px', color: '#818cf8', fontWeight: '600' }}>
                          &bull; {c.resident.flat_number} ({c.resident.full_name})
                        </span>
                      )}
                      <SLACountdownBadge complaint={c} />
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        &bull; {formatDate(c.created_at)}
                      </span>
                    </div>

                    <div style={{ fontSize: '15px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>
                      {c.title}
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.description}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} isOverdue={c.is_overdue} />
                    <button
                      onClick={() => openComplaintModal(c)}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '8px 14px' }}
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
          maxWidth="760px"
        >
          <div>
            {/* Resident contact card */}
            <div
              style={{
                background: 'rgba(13, 21, 39, 0.8)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resident Details</div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
                  {selectedComplaint.resident?.full_name} &bull; {selectedComplaint.resident?.flat_number}
                </div>
              </div>

              {selectedComplaint.resident?.phone_number && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--accent-cyan)' }}>
                  <Phone size={14} />
                  <span>{selectedComplaint.resident.phone_number}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600' }}>
                Description
              </div>
              <div style={{ background: 'rgba(7, 11, 20, 0.6)', padding: '14px', borderRadius: 'var(--radius-sm)', color: '#f1f5f9', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                {selectedComplaint.description}
              </div>
            </div>

            {/* Attachments */}
            {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '600' }}>
                  Attachments ({selectedComplaint.attachments.length})
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {selectedComplaint.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={`${API_ROOT}${att.file_path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        width: '120px',
                        height: '80px',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-medium)'
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
            <form onSubmit={handleStatusSubmit} style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setSelectedComplaint(null)} className="btn btn-secondary">
                  Close
                </button>
                <button type="submit" disabled={updating} className="btn btn-primary">
                  <span>{updating ? 'Saving...' : 'Save Status Update'}</span>
                </button>
              </div>
            </form>

            {/* Discussion Thread */}
            <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid var(--border-subtle)' }}>
              <CommentsThread complaintId={selectedComplaint.id} initialComments={selectedComplaint.comments} />
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
