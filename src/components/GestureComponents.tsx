'use client';

import { useState } from 'react';

// Component pentru afișarea gesture hints
export function GestureHints({ hints, visible = true }: { hints: string[]; visible?: boolean }) {
  const [currentHint, setCurrentHint] = useState(0);
  
  if (!visible || hints.length === 0) return null;
  
  return (
    <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-black bg-opacity-75 text-white px-4 py-2 rounded-full text-sm transition-opacity duration-300">
      {hints[currentHint]}
    </div>
  );
}

// Component pentru ripple effect
export function RippleEffect({ ripples }: { ripples: Array<{ id: number; x: number; y: number }> }) {
  return (
    <>
      {ripples.map(ripple => (
        <div
          key={ripple.id}
          className="absolute pointer-events-none rounded-full bg-white bg-opacity-30 animate-ping"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </>
  );
}