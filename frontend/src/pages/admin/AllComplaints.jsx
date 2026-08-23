import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Download,
  Flame,
  AlertCircle,
  Clock,
  CheckCircle2,
  User,
  Wrench,
  Sparkles,
  RefreshCw,
  Eye,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';
import { api, API_ROOT } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SLACountdownBadge } from '../../components/SLACountdownBadge';
import { Modal } from '../../components/Modal';
import { Timeline } from '../../components/Timeline';
import { CommentsThread } from '../../components/CommentsThread';

export const AllComplaints = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [isOverdueFilter, setIsOverdueFilter] = useState(searchParams.get('is_overdue') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Detail & Management Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // 'details', 'timeline', 'comments'
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      if (isOverdueFilter) params.is_overdue = isOverdueFilter === 'true';
      if (searchQuery) params.search = searchQuery;

      const [complaintsData, staffData, catsData] = await Promise.all([
        api.getComplaints(params),
        api.getStaffList().catch(() => []),
        api.getCategories().catch(() => [])
      ]);

      setComplaints(complaintsData);
      setStaffList(staffData);
      setCategories(catsData);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [categoryFilter, statusFilter, priorityFilter, isOverdueFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchComplaints();
  };

  const openComplaintModal = async (c) => {
    try {
      const detail = await api.getComplaint(c.id);
      setSelectedComplaint(detail);
      setNewStatus(detail.status);
      setNewPriority(detail.priority);
      setAssignedStaffId(detail.assigned_to ? String(detail.assigned_to) : '');
      setActionNote('');
      setActiveTab('details');
    } catch (err) {
      alert('Failed to load full complaint record.');
    }
  };

  const handleSaveComplaintUpdates = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdating(true);

    try {
      // 1. Status update if changed
      if (newStatus !== selectedComplaint.status) {
        await api.updateComplaintStatus(selectedComplaint.id, newStatus, actionNote);
      }

      // 2. Priority update if changed
      if (newPriority !== selectedComplaint.priority) {
        await api.updateComplaintPriority(selectedComplaint.id, newPriority, actionNote);
      }

      // 3. Staff assignment if changed
      const currentStaff = selectedComplaint.assigned_to ? String(selectedComplaint.assigned_to) : '';
      if (assignedStaffId !== currentStaff) {
        const staffIdNum = assignedStaffId ? parseInt(assignedStaffId, 10) : null;
        await api.assignComplaint(selectedComplaint.id, staffIdNum, actionNote);
      }

      setSelectedComplaint(null);
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Failed to update complaint.');
    } finally {
      setUpdating(false);
    }
  };

  const handleReopenReview = async (requestId, decision) => {
    const adminNotes = prompt(`Enter optional remarks for ${decision.toLowerCase()} reopen request:`) || '';
    try {
      await api.reviewReopenRequest(requestId, decision, adminNotes);
      const refreshed = await api.getComplaint(selectedComplaint.id);
      setSelectedComplaint(refreshed);
      fetchComplaints();
    } catch (err) {
      alert(err.message || 'Failed to review reopen request.');
    }
  };

  const handleExportCsv = () => {
    const params = {};
    if (categoryFilter) params.category = categoryFilter;
    if (statusFilter) params.status = statusFilter;
    if (isOverdueFilter) params.is_overdue = isOverdueFilter === 'true';
    const url = api.getComplaintsCsvDownloadUrl(params);
    window.open(url, '_blank');
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
        title="All Complaints Registry"
        subtitle="Full administrative directory with staff assignment, category SLA countdowns, and CSV reporting"
        extraAction={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleExportCsv} className="btn btn-secondary btn-sm">
              <FileSpreadsheet size={15} color="var(--accent-emerald)" />
              <span>Export CSV</span>
            </button>
            <button onClick={fetchComplaints} className="btn btn-secondary btn-sm" disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      <div className="page-body">
        {/* Search & Filter Bar */}
        <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: '24px' }}>
          <form onSubmit={handleSearch}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
              {/* Search */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Search Query</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Search ID, title, resident, staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '34px' }}
                  />
                  <Search size={15} style={{ position: 'absolute', left: '11px', top: '12px', color: 'var(--text-muted)' }} />
                </div>
              </div>

              {/* Category */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Category</label>
                <select
                  className="select-field"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
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

              <button type="submit" className="btn btn-primary" style={{ padding: '10px 16px' }}>
                <Search size={15} />
                <span>Search</span>
              </button>
            </div>
          </form>
        </div>

        {/* Complaints List */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '16px', color: '#ffffff', margin: 0 }}>
              Complaints Registry ({complaints.length})
            </h2>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Sorted: Overdue First &bull; Created Date
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-muted)' }}>
              Filtering records...
            </div>
          ) : complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
              No complaints match the current filter selection.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {complaints.map((c) => (
                <div
                  key={c.id}
                  className="glass-panel glass-panel-interactive"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    borderLeft: c.is_overdue && c.status !== 'Resolved' ? '4px solid #f43f5e' : '1px solid var(--border-subtle)'
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
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

                    {c.assigned_staff && (
                      <div style={{ fontSize: '11px', color: '#a78bfa', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Wrench size={12} />
                        <span>Assigned to <strong>{c.assigned_staff.full_name}</strong> ({c.assigned_staff.specialization})</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} isOverdue={c.is_overdue} />
                    <button
                      onClick={() => openComplaintModal(c)}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '8px 14px' }}
                    >
                      Manage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Admin Full Management Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Manage Complaint #${selectedComplaint.id}`}
          maxWidth="840px"
        >
          <div>
            {/* Pending Reopen Alert if present */}
            {selectedComplaint.reopen_requests?.some(r => r.status === 'Pending') && (
              <div
                style={{
                  background: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#fb7185' }}>
                    ⚠️ Resident Requested Ticket Reopen
                  </div>
                  <div style={{ fontSize: '12px', color: '#fecdd3', marginTop: '2px' }}>
                    Reason: "{selectedComplaint.reopen_requests.find(r => r.status === 'Pending')?.reason}"
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => handleReopenReview(selectedComplaint.reopen_requests.find(r => r.status === 'Pending').id, 'Approved')}
                    className="btn btn-primary btn-sm"
                    style={{ background: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)' }}
                  >
                    Approve Reopen
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReopenReview(selectedComplaint.reopen_requests.find(r => r.status === 'Pending').id, 'Rejected')}
                    className="btn btn-secondary btn-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px', paddingBottom: '10px' }}>
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`btn btn-sm ${activeTab === 'details' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Ticket & Actions
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`btn btn-sm ${activeTab === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Lifecycle Audit Timeline ({selectedComplaint.history?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                className={`btn btn-sm ${activeTab === 'comments' ? 'btn-primary' : 'btn-secondary'}`}
              >
                Discussion Thread ({selectedComplaint.comments?.length || 0})
              </button>
            </div>

            {activeTab === 'details' && (
              <div>
                {/* Resident & Ticket Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                  <div style={{ background: 'rgba(13, 21, 39, 0.8)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Resident Details</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
                      {selectedComplaint.resident?.full_name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Flat: {selectedComplaint.resident?.flat_number} &bull; {selectedComplaint.resident?.phone_number || selectedComplaint.resident?.email}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(13, 21, 39, 0.8)', padding: '14px', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>SLA Target</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
                      {selectedComplaint.category_sla_days || 7} Days Category SLA
                    </div>
                    <div style={{ fontSize: '12px', marginTop: '2px' }}>
                      <SLACountdownBadge complaint={selectedComplaint} />
                    </div>
                  </div>
                </div>

                {/* Title & Description */}
                <div style={{ marginBottom: '18px' }}>
                  <h4 style={{ fontSize: '16px', color: '#ffffff', margin: '0 0 6px 0' }}>{selectedComplaint.title}</h4>
                  <div style={{ background: 'rgba(7, 11, 20, 0.6)', padding: '14px', borderRadius: 'var(--radius-sm)', color: '#e2e8f0', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {selectedComplaint.description}
                  </div>
                </div>

                {/* Supporting Photos */}
                {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '600' }}>
                      Attached Photos ({selectedComplaint.attachments.length})
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

                {/* Admin Mutation Form */}
                <form onSubmit={handleSaveComplaintUpdates} style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                    {/* Status */}
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Status</label>
                      <select
                        className="select-field"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                      >
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
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>

                    {/* Staff Assignment */}
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Assign Staff</label>
                      <select
                        className="select-field"
                        value={assignedStaffId}
                        onChange={(e) => setAssignedStaffId(e.target.value)}
                      >
                        <option value="">Unassigned</option>
                        {staffList.map((st) => (
                          <option key={st.id} value={String(st.id)}>
                            {st.full_name} ({st.specialization})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="input-group">
                    <label className="input-label">Administrative Action Remarks (Logged to History)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Assigned to plumber; scheduled site visit for 10 AM tomorrow."
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button type="button" onClick={() => setSelectedComplaint(null)} className="btn btn-secondary">
                      Close
                    </button>
                    <button type="submit" disabled={updating} className="btn btn-primary">
                      <span>{updating ? 'Saving...' : 'Apply Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div style={{ padding: '10px 0' }}>
                <Timeline history={selectedComplaint.history} />
              </div>
            )}

            {activeTab === 'comments' && (
              <div style={{ padding: '10px 0' }}>
                <CommentsThread complaintId={selectedComplaint.id} initialComments={selectedComplaint.comments} />
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};
