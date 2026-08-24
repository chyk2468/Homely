import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = '550px' }) => {
  const [isRendered, setIsRendered] = useState(isOpen);
  const [isClosing, setIsClosing] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setIsClosing(false);
    } else if (isRendered && !isClosing) {
      setIsClosing(true);
      timerRef.current = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
      }, 220);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isRendered && !isClosing) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRendered, isClosing]);

  const handleClose = () => {
    setIsClosing(true);
    timerRef.current = setTimeout(() => {
      setIsRendered(false);
      setIsClosing(false);
      onClose();
    }, 220);
  };

  if (!isRendered) return null;

  return (
    <div
      className={`modal-overlay ${isClosing ? 'modal-closing' : ''}`}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-box"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E7E7E9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#FFFFFF'
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#222222' }}>{title}</h3>
          <button
            onClick={handleClose}
            className="btn-icon"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#777777',
              cursor: 'pointer',
              display: 'flex',
              padding: '6px',
              borderRadius: '6px',
              transition: 'background-color 0.15s, color 0.15s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F7F7F8';
              e.currentTarget.style.color = '#222222';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#777777';
            }}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', overflowY: 'auto', background: '#FFFFFF' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
