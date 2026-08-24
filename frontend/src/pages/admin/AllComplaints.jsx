import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Wrench,
  RefreshCw,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import { api, API_ROOT } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { SLACountdownBadge } from '../../components/SLACountdownBadge';
import { Modal } from '../../components/Modal';
import { Timeline } from '../../components/Timeline';
import { CommentsThread } from '../../components/CommentsThread';
import { SkeletonListRow } from '../../components/Skeleton';
import { useToast } from '../../context/ToastContext';

export const AllComplaints = () => {
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || '');
  const [isOverdueFilter, setIsOverdueFilter] = useState(searchParams.get('is_overdue') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Detail & Management Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [actionNote, setActionNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  const fetchComplaints = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

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
      if (isManual) {
        toast.success('Registry updated', 'Retrieved latest complaint records.');
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
      if (isManual) toast.error('Refresh failed', 'Could not load complaints.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [categoryFilter, statusFilter, priorityFilter, isOverdueFilter]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    await fetchComplaints();
    setSearching(false);
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
      setUpdateSuccess(false);
    } catch {
      toast.error('Load error', 'Failed to load full complaint record.');
    }
  };

  const handleSaveComplaintUpdates = async (e) => {
    e.preventDefault();
    if (!selectedComplaint) return;
    setUpdating(true);

    try {
      if (newStatus !== selectedComplaint.status) {
        await api.updateComplaintStatus(selectedComplaint.id, newStatus, actionNote);
      }
      if (newPriority !== selectedComplaint.priority) {
        await api.updateComplaintPriority(selectedComplaint.id, newPriority, actionNote);
      }
      const currentStaff = selectedComplaint.assigned_to ? String(selectedComplaint.assigned_to) : '';
      if (assignedStaffId !== currentStaff) {
        const staffIdNum = assignedStaffId ? parseInt(assignedStaffId, 10) : null;
        await api.assignComplaint(selectedComplaint.id, staffIdNum, actionNote);
      }

      setUpdating(false);
      setUpdateSuccess(true);
      toast.success('Complaint updated', `Changes to #${selectedComplaint.id} saved.`);

      setTimeout(() => {
        setSelectedComplaint(null);
        fetchComplaints();
      }, 700);
    } catch (err) {
      setUpdating(false);
      toast.error('Update failed', err.message || 'Failed to update complaint.');
    }
  };

  const handleReopenReview = async (requestId, decision) => {
    const adminNotes = prompt(`Enter optional remarks for ${decision.toLowerCase()} reopen request:`) || '';
    try {
      await api.reviewReopenRequest(requestId, decision, adminNotes);
      toast.success('Review complete', `Reopen request ${decision.toLowerCase()}.`);
      const refreshed = await api.getComplaint(selectedComplaint.id);
      setSelectedComplaint(refreshed);
      fetchComplaints();
    } catch (err) {
      toast.error('Action failed', err.message || 'Failed to review reopen request.');
    }
  };

  const handleExportCsv = async () => {
    try {
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (isOverdueFilter) params.is_overdue = isOverdueFilter === 'true';
      await api.downloadComplaintsCsv(params);
      toast.success('Report exported', 'Complaints CSV downloaded successfully.');
    } catch (err) {
      toast.error('Export failed', err.message || 'Failed to export CSV report.');
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
        title="All Complaints Registry"
        subtitle="Comprehensive administrative directory with technician assignment and CSV export"
        extraAction={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleExportCsv} className="btn btn-secondary btn-sm" style={{ padding: '6px 12px', fontSize: '12px' }}>
              <FileSpreadsheet size={14} color="#46B878" />
              <span>Export CSV</span>
            </button>
            <button onClick={() => fetchComplaints(true)} className="btn btn-secondary btn-sm" disabled={loading || refreshing} style={{ padding: '6px 10px', fontSize: '12px' }}>
              <RefreshCw size={13} className={refreshing ? 'spin-once' : ''} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        }
      />

      <div className="page-body">
        {/* Search & Filter Bar */}
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
          <form onSubmit={handleSearch}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', alignItems: 'flex-end' }}>
              {/* Search */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Search Query</label>
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

              {/* Category */}
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Category</label>
                <select
                  className="select-field"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={{ fontSize: '12px' }}
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

              <button type="submit" disabled={searching} className="btn btn-primary" style={{ padding: '9px 16px', fontSize: '13px' }}>
                {searching ? (
                  <span className="btn-spinner" style={{ width: '13px', height: '13px' }} />
                ) : (
                  <Search size={14} />
                )}
                <span>{searching ? 'Filtering...' : 'Search'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Complaints List */}
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
              Complaints Registry ({complaints.length})
            </h2>
            <div style={{ fontSize: '11px', color: '#777777' }}>
              Sorted by overdue status & creation date
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <SkeletonListRow />
              <SkeletonListRow />
              <SkeletonListRow />
            </div>
          ) : complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#777777', fontSize: '13px' }}>
              No complaints match the current filter selection.
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
                    transition: 'all 0.18s cubic-bezier(0.22, 1, 0.36, 1)',
                    animation: `itemSlideUp 0.35s cubic-bezier(0.22, 1, 0.36, 1) ${idx * 0.03}s both`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FAFAFA';
                    e.currentTarget.style.transform = 'translateY(-1.5px)';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.04)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
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

                    {c.assigned_staff && (
                      <div style={{ fontSize: '11px', color: '#F04B4F', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500' }}>
                        <Wrench size={11} />
                        <span>Assigned to {c.assigned_staff.full_name} ({c.assigned_staff.specialization})</span>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <PriorityBadge priority={c.priority} />
                    <StatusBadge status={c.status} isOverdue={c.is_overdue} />
                    <button
                      onClick={() => openComplaintModal(c)}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '6px 12px', fontSize: '12px' }}
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

      {/* Admin Management Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Manage Complaint #${selectedComplaint.id}`}
          maxWidth="780px"
        >
          <div>
            {/* Reopen Request Banner */}
            {selectedComplaint.reopen_requests?.some(r => r.status === 'Pending') && (
              <div
                style={{
                  background: '#FCECED',
                  border: '1px solid #F9D0D2',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#F04B4F' }}>
                    Resident Requested Ticket Reopen
                  </div>
                  <div style={{ fontSize: '12px', color: '#444444', marginTop: '2px' }}>
                    Reason: "{selectedComplaint.reopen_requests.find(r => r.status === 'Pending')?.reason}"
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => handleReopenReview(selectedComplaint.reopen_requests.find(r => r.status === 'Pending').id, 'Approved')}
                    className="btn btn-success btn-sm"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReopenReview(selectedComplaint.reopen_requests.find(r => r.status === 'Pending').id, 'Rejected')}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Tabs with Animated Sliding Style */}
            <div
              style={{
                display: 'flex',
                gap: '6px',
                borderBottom: '1px solid #E7E7E9',
                marginBottom: '16px',
                paddingBottom: '8px',
                position: 'relative'
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={`btn btn-sm ${activeTab === 'details' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                Ticket & Actions
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('timeline')}
                className={`btn btn-sm ${activeTab === 'timeline' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                Timeline ({selectedComplaint.history?.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                className={`btn btn-sm ${activeTab === 'comments' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '12px', padding: '5px 12px' }}
              >
                Discussion ({selectedComplaint.comments?.length || 0})
              </button>
            </div>

            {activeTab === 'details' && (
              <div style={{ animation: 'pageFadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}>
                {/* Resident & Ticket Info */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ background: '#F7F7F8', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E7E7E9' }}>
                    <div style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase' }}>Resident Details</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#222222', marginTop: '2px' }}>
                      {selectedComplaint.resident?.full_name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#777777', marginTop: '1px' }}>
                      Flat: {selectedComplaint.resident?.flat_number} &bull; {selectedComplaint.resident?.phone_number || selectedComplaint.resident?.email}
                    </div>
                  </div>

                  <div style={{ background: '#F7F7F8', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E7E7E9' }}>
                    <div style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase' }}>SLA Target</div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#222222', marginTop: '2px' }}>
                      {selectedComplaint.category_sla_days || 7} Days Category SLA
                    </div>
                    <div style={{ fontSize: '11px', marginTop: '2px' }}>
                      <SLACountdownBadge complaint={selectedComplaint} />
                    </div>
                  </div>
                </div>

                {/* Title & Description */}
                <div style={{ marginBottom: '14px' }}>
                  <h4 style={{ fontSize: '15px', color: '#222222', margin: '0 0 4px 0', fontWeight: '700' }}>{selectedComplaint.title}</h4>
                  <div style={{ background: '#F7F7F8', padding: '12px', borderRadius: '6px', color: '#222222', fontSize: '12px', lineHeight: '1.4', whiteSpace: 'pre-wrap', border: '1px solid #E7E7E9' }}>
                    {selectedComplaint.description}
                  </div>
                </div>

                {/* Supporting Photos */}
                {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase', marginBottom: '6px', fontWeight: '600' }}>
                      Attached Photos ({selectedComplaint.attachments.length})
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

                {/* Mutation Form */}
                <form onSubmit={handleSaveComplaintUpdates} style={{ marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #E7E7E9' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    {/* Status */}
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <label className="input-label">Status</label>
                      <select
                        className="select-field"
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value)}
                        style={{ fontSize: '12px' }}
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
                        style={{ fontSize: '12px' }}
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
                        style={{ fontSize: '12px' }}
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
                    <label className="input-label">Admin Action Remarks (Logged to History)</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Assigned to electrician; site visit scheduled."
                      value={actionNote}
                      onChange={(e) => setActionNote(e.target.value)}
                      style={{ fontSize: '12px' }}
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
                      <span>{updating ? 'Saving...' : updateSuccess ? 'Saved' : 'Apply Changes'}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'timeline' && (
              <div style={{ padding: '6px 0', animation: 'pageFadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}>
                <Timeline history={selectedComplaint.history} />
              </div>
            )}

            {activeTab === 'comments' && (
              <div style={{ padding: '6px 0', animation: 'pageFadeInUp 0.3s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}>
                <CommentsThread complaintId={selectedComplaint.id} initialComments={selectedComplaint.comments} />
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};
