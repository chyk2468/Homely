import React, { useState } from 'react';
import { Star, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Modal } from './Modal';
import { api } from '../api/client';

export const FeedbackModal = ({ isOpen, onClose, complaintId, onSubmitted }) => {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const feedback = await api.postFeedback(complaintId, rating, comment);
      setSuccess(true);
      if (onSubmitted) onSubmitted(feedback);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Resolution Satisfaction" maxWidth="500px">
      {success ? (
        <div style={{ textAlign: 'center', padding: '30px 20px' }}>
          <CheckCircle2 size={42} color="var(--accent-emerald)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ color: '#ffffff', marginBottom: '6px' }}>Thank You!</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Your feedback helps our society maintenance team improve service quality.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                color: '#fb7185',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '16px'
              }}
            >
              <AlertCircle size={15} />
              <div>{error}</div>
            </div>
          )}

          <div style={{ textAlign: 'center', margin: '16px 0 24px' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              How satisfied are you with the resolution of Complaint #{complaintId}?
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    color: (hoverRating || rating) >= star ? '#facc15' : 'var(--text-muted)',
                    transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Star
                    size={32}
                    fill={(hoverRating || rating) >= star ? '#facc15' : 'transparent'}
                  />
                </button>
              ))}
            </div>

            <div style={{ fontSize: '13px', color: '#facc15', fontWeight: '700', marginTop: '8px' }}>
              {rating === 5 && '⭐⭐⭐⭐⭐ Excellent Resolution'}
              {rating === 4 && '⭐⭐⭐⭐ Good Service'}
              {rating === 3 && '⭐⭐⭐ Satisfactory'}
              {rating === 2 && '⭐⭐ Needs Improvement'}
              {rating === 1 && '⭐ Poor Experience'}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Optional Comments / Compliments</label>
            <textarea
              className="textarea-field"
              rows={3}
              placeholder="Tell us what went well or how we can improve..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Sparkles size={15} />
              <span>{loading ? 'Submitting...' : 'Submit Rating'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
