import React from 'react';

export const Skeleton = ({
  width = '100%',
  height = '16px',
  borderRadius = '6px',
  style = {}
}) => {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
      aria-hidden="true"
    />
  );
};

export const SkeletonStatsCard = () => (
  <div
    style={{
      padding: '20px 22px',
      backgroundColor: '#FFFFFF',
      border: '1px solid #E7E7E9',
      borderRadius: '12px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1 }}>
        <Skeleton width="90px" height="12px" style={{ marginBottom: '8px' }} />
        <Skeleton width="60px" height="28px" style={{ marginBottom: '6px' }} />
        <Skeleton width="120px" height="11px" />
      </div>
      <Skeleton width="42px" height="42px" borderRadius="8px" />
    </div>
  </div>
);

export const SkeletonListRow = () => (
  <div
    style={{
      padding: '14px 18px',
      borderRadius: '10px',
      border: '1px solid #E7E7E9',
      backgroundColor: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '14px',
      marginBottom: '8px'
    }}
  >
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
        <Skeleton width="40px" height="14px" borderRadius="4px" />
        <Skeleton width="80px" height="14px" borderRadius="4px" />
        <Skeleton width="90px" height="14px" borderRadius="4px" />
      </div>
      <Skeleton width="65%" height="16px" style={{ marginBottom: '4px' }} />
      <Skeleton width="45%" height="12px" />
    </div>
    <div style={{ display: 'flex', gap: '8px' }}>
      <Skeleton width="70px" height="24px" borderRadius="999px" />
      <Skeleton width="70px" height="24px" borderRadius="999px" />
    </div>
  </div>
);
