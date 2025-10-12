'use client';

/**
 * METODA #1: Classical Script Tag with Callback
 * Uses window.initMap callback pattern from official Google Maps documentation
 */

import { useEffect, useRef, useState } from 'react';

interface GoogleMapMethod1Props {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
  }>;
  className?: string;
}

// Declare global initMap for TypeScript
declare global {
  interface Window {
    initMap?: () => void;
    google?: typeof google;
  }
}

export default function GoogleMapMethod1({
  center = { lat: 45.9432, lng: 24.9668 },
  zoom = 7,
  markers = [],
  className = 'w-full h-[400px] rounded-lg'
}: GoogleMapMethod1Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      initializeMap();
      return;
    }

    // Define global callback
    window.initMap = () => {
      console.log('✅ METODA #1: Google Maps loaded via callback');
      initializeMap();
    };

    // Wait for script to load (timeout fallback)
    const checkInterval = setInterval(() => {
      if (window.google?.maps) {
        clearInterval(checkInterval);
        initializeMap();
      }
    }, 100);

    // Cleanup
    return () => {
      clearInterval(checkInterval);
    };
  }, []);

  const initializeMap = () => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) return; // Already initialized

    try {
      const map = new google.maps.Map(mapRef.current, {
        center: center,
        zoom: zoom,
        mapId: 'DEMO_MAP_ID',
      });

      mapInstanceRef.current = map;

      // Add markers using standard Marker (not AdvancedMarker for simplicity)
      markers.forEach((markerData) => {
        new google.maps.Marker({
          map: map,
          position: markerData.position,
          title: markerData.title || 'Marker'
        });
      });

      setLoading(false);
      setError(null);
      console.log('✅ METODA #1: Map initialized successfully');
    } catch (err) {
      console.error('❌ METODA #1: Map initialization error:', err);
      setError('Failed to initialize map');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className={`${className} bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center`}>
        <div className="text-center p-4">
          <p className="text-red-600 font-semibold">❌ METODA #1 Failed</p>
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 mb-3"></div>
          <p className="text-gray-600 text-sm">⏳ Loading METODA #1...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="bg-green-100 border border-green-300 rounded px-3 py-1 text-sm text-green-800">
        ✅ METODA #1: Classical Script Tag Active
      </div>
      <div 
        ref={mapRef} 
        className={className}
        aria-label="Google Map - Method 1"
      />
    </div>
  );
}
