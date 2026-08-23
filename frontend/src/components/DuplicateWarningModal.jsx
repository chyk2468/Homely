import React from 'react';
import { AlertTriangle, ExternalLink, ArrowRight } from 'lucide-react';
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
    <Modal isOpen={isOpen} onClose={onClose} title="Possible Similar Complaints Detected" maxWidth="560px">
      <div>
        <div
          style={{
            padding: '12px 14px',
            borderRadius: '8px',
            background: '#FDF6E9',
            border: '1px solid #F8E3BC',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            marginBottom: '16px'
          }}
        >
          <AlertTriangle size={18} color="#E5A83B" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '13px', color: '#92400E', lineHeight: '1.4' }}>
            We found {duplicates.length} recent complaint{duplicates.length > 1 ? 's' : ''} with similar keywords. Review them to avoid submitting duplicate tickets:
          </div>
        </div>

        {/* Duplicates List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {duplicates.map((item) => (
            <div
              key={item.id}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #E7E7E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: '#F04B4F' }}>#{item.id}</span>
                  <span style={{ fontSize: '11px', color: '#777777' }}>&bull; {item.category}</span>
                  <span style={{ fontSize: '11px', color: '#A0A0A0' }}>&bull; {formatDate(item.created_at)}</span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: '600', color: '#222222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </div>
              </div>

              {onViewComplaint && (
                <button
                  type="button"
                  onClick={() => onViewComplaint(item.id)}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '4px 8px', fontSize: '11px', display: 'flex', gap: '4px', flexShrink: 0 }}
                >
                  <span>View</span>
                  <ExternalLink size={11} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Review Form
          </button>
          <button type="button" onClick={onConfirmSubmit} className="btn btn-primary">
            <span>Submit Anyway</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </Modal>
  );
};
