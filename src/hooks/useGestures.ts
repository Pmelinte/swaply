'use client';

import { useState, useRef, useCallback } from 'react';

interface SwipeGestures {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onDoubleTap?: () => void;
  onPinch?: (scale: number) => void;
  threshold?: number;
}

interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

export function useSwipeGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onDoubleTap,
  onPinch,
  threshold = 50
}: SwipeGestures) {
  const [touchStart, setTouchStart] = useState<TouchPosition | null>(null);
  const [lastTap, setLastTap] = useState<number>(0);
  const [initialPinchDistance, setInitialPinchDistance] = useState<number>(0);
  const elementRef = useRef<HTMLElement>(null);

  const getDistance = (touch1: React.Touch, touch2: React.Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    if (e.touches.length === 1) {
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        time: now
      });
      
      // Check for double tap
      if (now - lastTap < 300) {
        onDoubleTap?.();
        setLastTap(0);
      } else {
        setLastTap(now);
      }
    } else if (e.touches.length === 2) {
      // Pinch gesture start
      const distance = getDistance(e.touches[0], e.touches[1]);
      setInitialPinchDistance(distance);
    }
  }, [lastTap, onDoubleTap]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance > 0) {
      // Handle pinch gesture
      const currentDistance = getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialPinchDistance;
      onPinch?.(scale);
    }
  }, [initialPinchDistance, onPinch]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart || e.touches.length > 0) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;
    const deltaTime = Date.now() - touchStart.time;
    
    // Ignore if touch was too long (likely a scroll)
    if (deltaTime > 500) return;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Determine swipe direction
    if (Math.max(absDeltaX, absDeltaY) > threshold) {
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          onSwipeDown?.();
        } else {
          onSwipeUp?.();
        }
      }
    }
    
    setTouchStart(null);
    setInitialPinchDistance(0);
  }, [touchStart, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return {
    ref: elementRef,
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
  };
}

// Hook pentru animații și feedback vizual
export function useVisualFeedback() {
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
  
  const addRipple = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    const newRipple = {
      id: Date.now(),
      x,
      y
    };
    
    setRipples(prev => [...prev, newRipple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);
  }, []);
  
  const handlePressStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsPressed(true);
    addRipple(e);
  }, [addRipple]);
  
  const handlePressEnd = useCallback(() => {
    setIsPressed(false);
  }, []);
  
  return {
    isPressed,
    ripples,
    onMouseDown: handlePressStart,
    onMouseUp: handlePressEnd,
    onMouseLeave: handlePressEnd,
    onTouchStart: handlePressStart,
    onTouchEnd: handlePressEnd,
  };
}

// Hook pentru gesturi de scroll infinite
export function useInfiniteScroll(callback: () => void, threshold = 100) {
  const [isFetching, setIsFetching] = useState(false);
  
  const handleScroll = useCallback(() => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = document.documentElement.clientHeight;
    
    if (scrollTop + clientHeight >= scrollHeight - threshold && !isFetching) {
      setIsFetching(true);
      callback();
    }
  }, [callback, threshold, isFetching]);
  
  const finishFetching = useCallback(() => {
    setIsFetching(false);
  }, []);
  
  return {
    isFetching,
    handleScroll,
    finishFetching
  };
}