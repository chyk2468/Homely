import React, { useState } from 'react';
import { AnimatedNumber } from './AnimatedNumber';

export const StatsCard = ({
  title,
  value,
  icon: Icon,
  color = 'coral',
  subtitle,
  alert = false,
  onClick,
  prefix = '',
  suffix = '',
  decimals = 0,
  staggerClass = ''
}) => {
  const [iconPulsing, setIconPulsing] = useState(false);

  const colorMap = {
    coral: {
      bg: '#FCECED',
      text: '#F04B4F'
    },
    amber: {
      bg: '#FDF6E9',
      text: '#E5A83B'
    },
    blue: {
      bg: '#EEF2FF',
      text: '#4F46E5'
    },
    emerald: {
      bg: '#EAF7F0',
      text: '#46B878'
    },
    rose: {
      bg: '#FCECED',
      text: '#F04B4F'
    },
    indigo: {
      bg: '#FCECED',
      text: '#F04B4F'
    }
  };

  const selectedColor = colorMap[color] || colorMap.coral;

  const handleAnimationComplete = () => {
    setIconPulsing(true);
    setTimeout(() => setIconPulsing(false), 500);
  };

  return (
    <div
      className={`glass-panel ${onClick ? 'glass-panel-interactive' : ''} ${alert ? 'overdue-border-pulse' : ''} ${staggerClass}`}
      onClick={onClick}
      style={{
        padding: '20px 22px',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        border: alert ? '1px solid #F9D0D2' : '1px solid #E7E7E9',
        backgroundColor: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
      }}
    >
      {alert && (
        <div
          className="overdue-pulse"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: '#F04B4F'
          }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#777777', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', fontFamily: 'var(--font-display)', color: '#222222', marginTop: '4px', lineHeight: 1.1 }}>
            {typeof value === 'number' || (!isNaN(parseFloat(value)) && isFinite(value)) ? (
              <AnimatedNumber
                value={value}
                prefix={prefix}
                suffix={suffix}
                decimals={decimals}
                onComplete={handleAnimationComplete}
              />
            ) : (
              `${prefix}${value}${suffix}`
            )}
          </div>
          {subtitle && (
            <div style={{ fontSize: '12px', color: '#777777', marginTop: '4px' }}>
              {subtitle}
            </div>
          )}
        </div>

        {Icon && (
          <div
            className={iconPulsing ? 'kpi-icon-pulse' : ''}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '8px',
              background: selectedColor.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: selectedColor.text,
              flexShrink: 0,
              transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)'
            }}
          >
            <Icon size={20} />
          </div>
        )}
      </div>
    </div>
  );
};
