import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const PageTransition = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <div key={location.pathname} className="page-enter" style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
      {children}
    </div>
  );
};
