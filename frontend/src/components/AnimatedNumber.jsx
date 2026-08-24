import React, { useState, useEffect, useRef } from 'react';

export const AnimatedNumber = ({
  value,
  duration = 800,
  decimals = 0,
  prefix = '',
  suffix = '',
  onComplete
}) => {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);
  const startTimeRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Smooth easing curve: cubic-bezier(0.22, 1, 0.36, 1) approximation
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = numericValue;
    const change = endVal - startVal;

    if (change === 0) {
      setDisplayValue(endVal);
      return;
    }

    startTimeRef.current = performance.now();

    const step = (now) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      const current = startVal + change * easedProgress;

      setDisplayValue(current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
        prevValueRef.current = endVal;
        if (onComplete) onComplete();
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [numericValue, duration, onComplete]);

  const formattedNumber = decimals > 0
    ? displayValue.toFixed(decimals)
    : Math.round(displayValue).toString();

  return (
    <span>
      {prefix}
      {formattedNumber}
      {suffix}
    </span>
  );
};
