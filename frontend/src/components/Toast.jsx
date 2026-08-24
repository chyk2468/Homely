import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

const ToastItem = ({ toast, onRemove }) => {
  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onRemove(toast.id);
      }, toast.duration);
      return () => clearTimeout(timer);
    }
  }, [toast, onRemove]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 size={18} color="#46B878" style={{ flexShrink: 0 }} />;
      case 'error':
        return <AlertCircle size={18} color="#F04B4F" style={{ flexShrink: 0 }} />;
      case 'warning':
        return <AlertTriangle size={18} color="#E5A83B" style={{ flexShrink: 0 }} />;
      default:
        return <Info size={18} color="#4F46E5" style={{ flexShrink: 0 }} />;
    }
  };

  const getProgressColor = () => {
    switch (toast.type) {
      case 'success':
        return '#46B878';
      case 'error':
        return '#F04B4F';
      case 'warning':
        return '#E5A83B';
      default:
        return '#4F46E5';
    }
  };

  return (
    <div
      className={`toast-item ${toast.isExiting ? 'toast-exit' : ''}`}
      role="status"
      aria-live="polite"
    >
      {getIcon()}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#222222', lineHeight: 1.2 }}>
          {toast.title}
        </div>
        {toast.message && (
          <div style={{ fontSize: '12px', color: '#777777', marginTop: '2px', lineHeight: 1.3 }}>
            {toast.message}
          </div>
        )}
      </div>

      <button
        onClick={() => onRemove(toast.id)}
        style={{
          background: 'none',
          border: 'none',
          color: '#A0A0A0',
          cursor: 'pointer',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'color 0.15s'
        }}
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>

      {toast.duration > 0 && (
        <div
          className="toast-progress-bar"
          style={{
            backgroundColor: getProgressColor(),
            animationDuration: `${toast.duration}ms`
          }}
        />
      )}
    </div>
  );
};

export const ToastContainer = ({ toasts, onRemove }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="assertive">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
};
