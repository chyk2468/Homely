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
  Sparkles
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
      setReopenSuccess('Reopen request submitted to society administration for review.');
      setReopenReason('');
      fetchDetail();
      setTimeout(() => {
        setReopenModalOpen(false);
        setReopenSuccess('');
      }, 1500);
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
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        Loading complaint record...
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="page-body" style={{ maxWidth: '600px', textAlign: 'center', padding: '60px 0' }}>
        <AlertCircle size={44} color="var(--accent-rose)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ color: '#ffffff' }}>Complaint Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>{error || 'This complaint may not exist or belongs to another resident.'}</p>
        <Link to="/resident/my-complaints" className="btn btn-secondary">
          <ArrowLeft size={16} />
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
            <ArrowLeft size={14} />
            <span>All Complaints</span>
          </Link>
        }
      />

      <div className="page-body" style={{ maxWidth: '1000px' }}>
        {/* Reopen / Feedback Action Bar for Resolved Complaints */}
        {isResolved && (
          <div
            className="glass-panel"
            style={{
              padding: '16px 24px',
              marginBottom: '24px',
              background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.12), rgba(13, 21, 39, 0.7))',
              borderLeft: '4px solid var(--accent-emerald)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '14px'
            }}
          >
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#ffffff' }}>
                🎉 Complaint Successfully Resolved
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {complaint.resolved_at && `Resolved on ${formatDate(complaint.resolved_at)}. `}
                {hasFeedback ? `Rated ${complaint.feedback.rating}/5 stars.` : 'How was your service experience?'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {!hasFeedback && (
                <button
                  onClick={() => setFeedbackOpen(true)}
                  className="btn btn-primary btn-sm"
                  style={{ display: 'flex', gap: '6px' }}
                >
                  <Star size={14} />
                  <span>Rate Satisfaction</span>
                </button>
              )}

              <button
                onClick={() => setReopenModalOpen(true)}
                disabled={pendingReopen}
                className="btn btn-secondary btn-sm"
                style={{ display: 'flex', gap: '6px' }}
              >
                <RefreshCcw size={14} />
                <span>{pendingReopen ? 'Reopen Under Review' : 'Issue Persists? Reopen'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Info Card */}
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '28px' }}>
          {/* Top meta */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <span
                  style={{
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'var(--accent-cyan)',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '700'
                  }}
                >
                  {complaint.category}
                </span>
                <SLACountdownBadge complaint={complaint} />
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Registered {formatDate(complaint.created_at)}
                </span>
              </div>

              <h1 style={{ fontSize: '24px', color: '#ffffff', margin: 0 }}>
                {complaint.title}
              </h1>

              {complaint.assigned_staff && (
                <div style={{ fontSize: '13px', color: '#a78bfa', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wrench size={14} />
                  <span>Assigned Staff: <strong>{complaint.assigned_staff.full_name}</strong> ({complaint.assigned_staff.specialization})</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} isOverdue={complaint.is_overdue} />
            </div>
          </div>

          {/* Description */}
          <div
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(13, 21, 39, 0.7)',
              border: '1px solid var(--border-subtle)',
              marginBottom: '24px'
            }}
          >
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', fontWeight: '600' }}>
              Problem Description
            </div>
            <div style={{ color: '#f8fafc', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {complaint.description}
            </div>
          </div>

          {/* Photos Attachment Gallery */}
          {allPhotos.length > 0 && (
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={16} color="var(--accent-cyan)" />
                <span>Supporting Photos ({allPhotos.length})</span>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {allPhotos.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightboxImage(imgUrl)}
                    style={{
                      position: 'relative',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      border: '1px solid var(--border-medium)',
                      width: '160px',
                      height: '110px'
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
                        background: 'rgba(0, 0, 0, 0.75)',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        color: '#ffffff',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <Maximize2 size={10} />
                      <span>View</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lifecycle & Status History Timeline */}
        <div className="glass-panel" style={{ padding: '32px', marginBottom: '28px' }}>
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px', color: '#ffffff', margin: 0 }}>Progress & Status History</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
              Chronological immutable audit log of status progressions, staff assignments, and remarks
            </p>
          </div>

          <Timeline history={complaint.history} />
        </div>

        {/* Discussion / Comments Section */}
        <div className="glass-panel" style={{ padding: '32px' }}>
          <CommentsThread complaintId={complaint.id} initialComments={complaint.comments} />
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
            background: 'rgba(0, 0, 0, 0.9)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
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
              style={{ position: 'absolute', top: '-40px', right: 0, padding: '6px 12px' }}
            >
              <X size={16} />
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
          maxWidth="550px"
        >
          {reopenSuccess ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <CheckCircle2 size={36} color="var(--accent-emerald)" style={{ margin: '0 auto 10px' }} />
              <p style={{ color: '#ffffff', fontSize: '14px' }}>{reopenSuccess}</p>
            </div>
          ) : (
            <form onSubmit={handleReopenSubmit}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                If the maintenance issue was not fully resolved or re-occurred, submit a reason for the administration to review and reopen the ticket.
              </p>

              <div className="input-group">
                <label className="input-label">Reason for Reopening *</label>
                <textarea
                  required
                  rows={4}
                  className="textarea-field"
                  placeholder="Explain why this issue requires further work..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
                <button type="button" onClick={() => setReopenModalOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={reopenSubmitting} className="btn btn-primary">
                  <span>{reopenSubmitting ? 'Submitting...' : 'Submit Reopen Request'}</span>
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
};
