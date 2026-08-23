import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  Building,
  CheckCircle2,
  Clock,
  AlertCircle,
  Image as ImageIcon,
  Maximize2,
  X,
  Star,
  RefreshCcw,
  Wrench,
  ShieldCheck
} from 'lucide-react';
import { api, API_ROOT } from '../../api/client';
import { Navbar } from '../../components/Navbar';
import { StatusBadge } from '../../components/StatusBadge';
import { PriorityBadge } from '../../components/PriorityBadge';
import { Timeline } from '../../components/Timeline';
import { CommentsThread } from '../../components/CommentsThread';
import { SLACountdownBadge } from '../../components/SLACountdownBadge';
import { FeedbackModal } from '../../components/FeedbackModal';
import { Modal } from '../../components/Modal';

export const ResidentComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lightboxImage, setLightboxImage] = useState(null);

  // Feedback Modal
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // Reopen Request Modal
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenSubmitting, setReopenSubmitting] = useState(false);
  const [reopenSuccess, setReopenSuccess] = useState('');

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const data = await api.getComplaint(id);
      setComplaint(data);
    } catch (err) {
      setError(err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenReason.trim()) return;
    setReopenSubmitting(true);

    try {
      await api.postReopenRequest(complaint.id, reopenReason.trim());
      setReopenSuccess('Reopen request submitted to administration for review.');
      setReopenReason('');
      fetchDetail();
      setTimeout(() => {
        setReopenModalOpen(false);
        setReopenSuccess('');
      }, 1400);
    } catch (err) {
      alert(err.message || 'Failed to submit reopen request.');
    } finally {
      setReopenSubmitting(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#777777', fontSize: '13px' }}>
        Loading complaint record...
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="page-body" style={{ maxWidth: '560px', textAlign: 'center', padding: '60px 0' }}>
        <AlertCircle size={40} color="#F04B4F" style={{ margin: '0 auto 14px' }} />
        <h2 style={{ color: '#222222', fontSize: '18px' }}>Complaint Not Found</h2>
        <p style={{ color: '#777777', fontSize: '13px', marginBottom: '20px' }}>{error || 'This complaint may not exist or belongs to another resident.'}</p>
        <Link to="/resident/my-complaints" className="btn btn-secondary">
          <ArrowLeft size={14} />
          <span>Back to My Complaints</span>
        </Link>
      </div>
    );
  }

  const allPhotos = [];
  if (complaint.attachments && complaint.attachments.length > 0) {
    complaint.attachments.forEach(att => allPhotos.push(`${API_ROOT}${att.file_path}`));
  } else if (complaint.photo_url) {
    allPhotos.push(`${API_ROOT}${complaint.photo_url}`);
  }

  const isResolved = complaint.status === 'Resolved';
  const hasFeedback = !!complaint.feedback;
  const pendingReopen = complaint.reopen_requests?.some(r => r.status === 'Pending');

  return (
    <>
      <Navbar
        title={`Complaint #${complaint.id}`}
        subtitle={`Category: ${complaint.category}`}
        extraAction={
          <Link to="/resident/my-complaints" className="btn btn-secondary btn-sm">
            <ArrowLeft size={13} />
            <span>All Complaints</span>
          </Link>
        }
      />

      <div className="page-body">
        {/* Reopen / Feedback Notification if Resolved */}
        {isResolved && (
          <div
            style={{
              padding: '14px 20px',
              marginBottom: '20px',
              backgroundColor: '#EAF7F0',
              border: '1px solid #C4EDD6',
              borderLeft: '4px solid #46B878',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#15803D' }}>
                Complaint Resolved
              </div>
              <div style={{ fontSize: '12px', color: '#444444', marginTop: '2px' }}>
                {complaint.resolved_at && `Resolved on ${formatDate(complaint.resolved_at)}. `}
                {hasFeedback ? `Rated ${complaint.feedback.rating}/5 stars.` : 'Please share your feedback or reopen if the issue persists.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {!hasFeedback && (
                <button
                  onClick={() => setFeedbackOpen(true)}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', gap: '4px' }}
                >
                  <Star size={13} />
                  <span>Rate Satisfaction</span>
                </button>
              )}

              <button
                onClick={() => setReopenModalOpen(true)}
                disabled={pendingReopen}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', gap: '4px' }}
              >
                <RefreshCcw size={13} />
                <span>{pendingReopen ? 'Reopen Under Review' : 'Issue Persists? Reopen'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2-Column Desktop Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: '24px', alignItems: 'start' }}>
          {/* Main Left Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: 0 }}>
            {/* Title & Description Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E7E7E9',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span
                  style={{
                    backgroundColor: '#FCECED',
                    color: '#F04B4F',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}
                >
                  {complaint.category}
                </span>
                <span style={{ fontSize: '12px', color: '#777777' }}>
                  Registered on {formatDate(complaint.created_at)}
                </span>
              </div>

              <h1 style={{ fontSize: '20px', color: '#222222', margin: '0 0 16px 0', fontWeight: '700' }}>
                {complaint.title}
              </h1>

              <div
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  backgroundColor: '#F7F7F8',
                  border: '1px solid #E7E7E9'
                }}
              >
                <div style={{ fontSize: '11px', color: '#777777', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px', fontWeight: '700' }}>
                  Problem Description
                </div>
                <div style={{ color: '#222222', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                  {complaint.description}
                </div>
              </div>

              {/* Photos Gallery */}
              {allPhotos.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#222222', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ImageIcon size={14} color="#F04B4F" />
                    <span>Supporting Photos ({allPhotos.length})</span>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {allPhotos.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setLightboxImage(imgUrl)}
                        style={{
                          position: 'relative',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: '1px solid #E7E7E9',
                          width: '140px',
                          height: '95px'
                        }}
                      >
                        <img
                          src={imgUrl}
                          alt={`Attachment ${idx + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover'
                          }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '4px',
                            right: '4px',
                            background: 'rgba(0, 0, 0, 0.7)',
                            padding: '2px 5px',
                            borderRadius: '3px',
                            color: '#ffffff',
                            fontSize: '9px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '2px'
                          }}
                        >
                          <Maximize2 size={9} />
                          <span>View</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Discussion Thread Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E7E7E9',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
              }}
            >
              <CommentsThread complaintId={complaint.id} initialComments={complaint.comments} />
            </div>

            {/* Lifecycle & Status History Timeline Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E7E7E9',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ marginBottom: '14px' }}>
                <h2 style={{ fontSize: '15px', color: '#222222', margin: 0, fontWeight: '700' }}>Progress Timeline</h2>
                <p style={{ fontSize: '12px', color: '#777777', margin: '2px 0 0 0' }}>
                  Audited history of status updates, remarks, and staff assignments
                </p>
              </div>

              <Timeline history={complaint.history} />
            </div>
          </div>

          {/* Right Section / Info Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Status & Priority Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E7E7E9',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#777777', marginBottom: '12px', letterSpacing: '0.04em' }}>
                Ticket Status & SLA
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#777777' }}>Current Status</span>
                  <StatusBadge status={complaint.status} isOverdue={complaint.is_overdue} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#777777' }}>Priority Level</span>
                  <PriorityBadge priority={complaint.priority} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #E7E7E9' }}>
                  <span style={{ fontSize: '13px', color: '#777777' }}>SLA Target</span>
                  <SLACountdownBadge complaint={complaint} />
                </div>

                <div style={{ fontSize: '11px', color: '#A0A0A0', textAlign: 'right' }}>
                  Category SLA: {complaint.category_sla_days || 7} days
                </div>
              </div>
            </div>

            {/* Assigned Staff Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E7E7E9',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#777777', marginBottom: '10px', letterSpacing: '0.04em' }}>
                Assigned Technician
              </div>

              {complaint.assigned_staff ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: '#FCECED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#F04B4F',
                      flexShrink: 0
                    }}
                  >
                    <Wrench size={16} />
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#222222' }}>
                      {complaint.assigned_staff.full_name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#777777' }}>
                      {complaint.assigned_staff.specialization} Specialist
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '12px', color: '#777777', fontStyle: 'italic' }}>
                  Staff assignment pending by society administrator.
                </div>
              )}
            </div>

            {/* Resident & Unit Info */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E7E7E9',
                borderRadius: '12px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#777777', marginBottom: '10px', letterSpacing: '0.04em' }}>
                Resident Unit
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#777777' }}>Resident:</span>
                  <span style={{ fontWeight: '600', color: '#222222' }}>{complaint.resident_name || 'Resident'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#777777' }}>Flat / Unit:</span>
                  <span style={{ fontWeight: '600', color: '#222222' }}>{complaint.flat_number || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setLightboxImage(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Expanded view"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '8px', objectFit: 'contain' }}
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="btn btn-secondary btn-sm"
              style={{ position: 'absolute', top: '-38px', right: 0, padding: '5px 10px' }}
            >
              <X size={15} />
              <span>Close</span>
            </button>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackOpen && (
        <FeedbackModal
          isOpen={feedbackOpen}
          onClose={() => setFeedbackOpen(false)}
          complaintId={complaint.id}
          onSubmitted={(fb) => {
            setComplaint(prev => ({ ...prev, feedback: fb }));
          }}
        />
      )}

      {/* Reopen Request Modal */}
      {reopenModalOpen && (
        <Modal
          isOpen={reopenModalOpen}
          onClose={() => setReopenModalOpen(false)}
          title={`Request Reopen: Complaint #${complaint.id}`}
          maxWidth="500px"
        >
          {reopenSuccess ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <CheckCircle2 size={32} color="#46B878" style={{ margin: '0 auto 8px' }} />
              <p style={{ color: '#222222', fontSize: '13px' }}>{reopenSuccess}</p>
            </div>
          ) : (
            <form onSubmit={handleReopenSubmit}>
              <p style={{ fontSize: '13px', color: '#777777', marginBottom: '14px' }}>
                If the maintenance issue was not fully resolved, describe what remains to be fixed:
              </p>

              <div className="input-group">
                <label className="input-label">Reason for Reopening *</label>
                <textarea
                  required
                  rows={4}
                  className="textarea-field"
                  placeholder="Explain why this issue requires further maintenance..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" onClick={() => setReopenModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={reopenSubmitting} className="btn btn-primary">
                  <span>{reopenSubmitting ? 'Submitting...' : 'Submit Reopen'}</span>
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
};
