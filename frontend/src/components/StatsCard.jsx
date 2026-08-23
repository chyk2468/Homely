import React from 'react';

export const StatsCard = ({ title, value, icon: Icon, color = 'cyan', subtitle, alert = false, onClick }) => {
  const colorMap = {
    cyan: {
      bg: 'rgba(6, 182, 212, 0.12)',
      text: 'var(--accent-cyan)',
      glow: 'var(--glow-cyan)'
    },
    amber: {
      bg: 'rgba(245, 158, 11, 0.12)',
      text: 'var(--accent-amber)',
      glow: '0 0 20px rgba(245, 158, 11, 0.25)'
    },
    blue: {
      bg: 'rgba(59, 130, 246, 0.12)',
      text: 'var(--accent-blue)',
      glow: '0 0 20px rgba(59, 130, 246, 0.25)'
    },
    emerald: {
      bg: 'rgba(16, 185, 129, 0.12)',
      text: 'var(--accent-emerald)',
      glow: 'var(--glow-emerald)'
    },
    rose: {
      bg: 'rgba(244, 63, 94, 0.15)',
      text: 'var(--accent-rose)',
      glow: 'var(--glow-rose)'
    },
    indigo: {
      bg: 'rgba(99, 102, 241, 0.12)',
      text: 'var(--accent-indigo)',
      glow: '0 0 20px rgba(99, 102, 241, 0.25)'
    }
  };

  const selectedColor = colorMap[color] || colorMap.cyan;

  return (
    <div
      className={`glass-panel ${onClick ? 'glass-panel-interactive' : ''}`}
      onClick={onClick}
      style={{
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        border: alert ? '1px solid rgba(244, 63, 94, 0.5)' : undefined
      }}
    >
      {alert && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, #f43f5e, #fb7185)'
          }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </div>
          <div style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#ffffff', marginTop: '6px' }}>
            {value}
          </div>
          {subtitle && (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {subtitle}
            </div>
          )}
        </div>

        {Icon && (
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: 'var(--radius-md)',
              background: selectedColor.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: selectedColor.text,
              boxShadow: selectedColor.glow
            }}
          >
            <Icon size={24} />
          </div>
        )}
      </div>
    </div>
  );
};
