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
    <Modal isOpen={isOpen} onClose={onClose} title="Rate Resolution Satisfaction" maxWidth="480px">
      {success ? (
        <div style={{ textAlign: 'center', padding: '24px 16px' }}>
          <CheckCircle2 size={36} color="#46B878" style={{ margin: '0 auto 10px' }} />
          <h3 style={{ color: '#222222', fontSize: '16px', marginBottom: '4px' }}>Thank You!</h3>
          <p style={{ color: '#777777', fontSize: '13px' }}>
            Your feedback helps our maintenance team improve service quality.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                background: '#FCECED',
                border: '1px solid #F9D0D2',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#F04B4F',
                fontSize: '12px',
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

          <div style={{ textAlign: 'center', margin: '12px 0 20px' }}>
            <div style={{ fontSize: '13px', color: '#777777', marginBottom: '10px' }}>
              How satisfied are you with the resolution of Complaint #{complaintId}?
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
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
                    padding: '3px',
                    color: (hoverRating || rating) >= star ? '#E5A83B' : '#E7E7E9',
                    transform: (hoverRating || rating) >= star ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Star
                    size={28}
                    fill={(hoverRating || rating) >= star ? '#E5A83B' : 'transparent'}
                  />
                </button>
              ))}
            </div>

            <div style={{ fontSize: '12px', color: '#E5A83B', fontWeight: '700', marginTop: '6px' }}>
              {rating === 5 && '⭐⭐⭐⭐⭐ Excellent Resolution'}
              {rating === 4 && '⭐⭐⭐⭐ Good Service'}
              {rating === 3 && '⭐⭐⭐ Satisfactory'}
              {rating === 2 && '⭐⭐ Needs Improvement'}
              {rating === 1 && '⭐ Poor Experience'}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Comments (Optional)</label>
            <textarea
              className="textarea-field"
              rows={3}
              placeholder="Tell us what went well or how we can improve..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Sparkles size={14} />
              <span>{loading ? 'Submitting...' : 'Submit Rating'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
