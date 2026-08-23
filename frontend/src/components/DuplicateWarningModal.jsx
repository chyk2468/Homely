import React from 'react';
import { AlertTriangle, ExternalLink, ArrowRight, X } from 'lucide-react';
import { Modal } from './Modal';

export const DuplicateWarningModal = ({ isOpen, onClose, duplicates, onConfirmSubmit, onViewComplaint }) => {
  if (!isOpen || !duplicates || duplicates.length === 0) return null;

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
    <Modal isOpen={isOpen} onClose={onClose} title="Possible Similar Complaints Detected" maxWidth="600px">
      <div>
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '18px'
          }}
        >
          <AlertTriangle size={20} color="#fbbf24" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px', color: '#fde68a', lineHeight: '1.5' }}>
            We found {duplicates.length} recent complaint{duplicates.length > 1 ? 's' : ''} in the same category with similar descriptions. Review them to avoid submitting a duplicate ticket:
          </div>
        </div>

        {/* Duplicates List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {duplicates.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(13, 21, 39, 0.8)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-cyan)' }}>#{item.id}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>&bull; {item.category}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>&bull; {formatDate(item.created_at)}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      background: item.status === 'Resolved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                      color: item.status === 'Resolved' ? '#34d399' : '#60a5fa',
                      fontWeight: '700'
                    }}
                  >
                    {item.status}
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </div>
              </div>

              {onViewComplaint && (
                <button
                  type="button"
                  onClick={() => onViewComplaint(item.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 10px', fontSize: '11px', display: 'flex', gap: '4px', flexShrink: 0 }}
                >
                  <span>View</span>
                  <ExternalLink size={11} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Review Form
          </button>
          <button type="button" onClick={onConfirmSubmit} className="btn btn-primary">
            <span>Submit Anyway</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </Modal>
  );
};
