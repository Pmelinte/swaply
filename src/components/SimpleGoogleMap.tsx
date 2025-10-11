'use client';

import { useEffect, useRef, useState } from 'react';

interface SimpleGoogleMapProps {
  apiKey: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
}

export default function SimpleGoogleMap({
  apiKey,
  center = { lat: 45.9432, lng: 24.9668 }, // Centru România
  zoom = 7,
  height = '400px'
}: SimpleGoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validare API key
    if (!apiKey || apiKey.length < 20) {
      setError('API key invalid sau lipsă');
      setLoading(false);
      return;
    }

    // Verifică dacă Google Maps e deja încărcat
    if (window.google?.maps) {
      initMap();
      return;
    }

    // Încarcă scriptul Google Maps
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google Maps script loaded');
      initMap();
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Google Maps script');
      setError('Eroare la încărcarea Google Maps');
      setLoading(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [apiKey]);

  const initMap = () => {
    if (!mapRef.current) {
      console.error('❌ Map container not ready');
      return;
    }

    if (!window.google?.maps) {
      console.error('❌ Google Maps not loaded');
      setError('Google Maps nu s-a încărcat');
      setLoading(false);
      return;
    }

    try {
      console.log('🗺️ Creating map instance...');
      
      const map = new google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      console.log('✅ Map created successfully!');
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('❌ Error creating map:', err);
      setError('Eroare la crearea hărții');
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-red-50 border-2 border-red-300 rounded-lg">
        <div className="text-center p-4">
          <p className="text-red-700 font-semibold mb-2">❌ Eroare</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ height }} className="flex items-center justify-center bg-blue-50 border-2 border-blue-300 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-700 font-semibold">Se încarcă harta...</p>
          <p className="text-blue-600 text-sm mt-2">API Key: {apiKey.substring(0, 10)}... ({apiKey.length} chars)</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} style={{ height, width: '100%' }} />;
}
