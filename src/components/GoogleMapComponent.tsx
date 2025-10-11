'use client';

/**
 * GoogleMapComponent - Google Maps integration for Swaply
 * 
 * Implementation based on official Google Maps JavaScript API documentation:
 * - https://developers.google.com/maps/documentation/javascript/adding-a-google-map
 * - Uses @googlemaps/js-api-loader v1.x functional API (setOptions + importLibrary)
 * - Implements AdvancedMarkerElement for modern marker support
 * 
 * Requirements verified 3x:
 * 1. API Key loaded from environment variable
 * 2. Functional API with importLibrary() pattern (Loader is deprecated)
 * 3. AdvancedMarkerElement with mapId for advanced features
 */

import { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface GoogleMapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
  }>;
  className?: string;
}

export default function GoogleMapComponent({
  center = { lat: 45.9432, lng: 24.9668 }, // Sibiu, Romania (default)
  zoom = 7,
  markers = [],
  className = 'w-full h-[400px] rounded-lg'
}: GoogleMapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    // Verificare API Key (conform documentației Google)
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      setError('Google Maps API Key missing. Please configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local');
      setLoading(false);
      return;
    }

    if (!mapRef.current) return;

    // Set options for Google Maps API (functional API - conform v1.x documentation)
    setOptions({
      key: apiKey,
      v: 'weekly', // Recommended by Google for latest features
      // No extra libraries needed - importLibrary will load them on-demand
    });

    let isMounted = true;

    // Load map cu pattern async/await (conform documentației oficiale)
    const initMap = async () => {
      try {
        // Step 1: Import 'maps' library (functional API)
        const { Map } = await importLibrary('maps') as google.maps.MapsLibrary;
        
        // Step 2: Import 'marker' library pentru AdvancedMarkerElement
        const { AdvancedMarkerElement } = await importLibrary('marker') as google.maps.MarkerLibrary;

        if (!isMounted || !mapRef.current) return;

        // Step 3: Create map instance (conform documentației Google)
        const mapOptions: google.maps.MapOptions = {
          center: center,
          zoom: zoom,
          mapId: 'SWAPLY_MAP_ID', // Required for AdvancedMarkerElement
          // Optional: Disable default UI pentru aspect curat
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        };

        const map = new Map(mapRef.current, mapOptions);
        mapInstanceRef.current = map;

        // Step 4: Add markers (conform pattern AdvancedMarkerElement)
        markers.forEach((markerData) => {
          new AdvancedMarkerElement({
            map: map,
            position: markerData.position,
            title: markerData.title || 'Marker'
          });
        });

        setLoading(false);
        setError(null);
      } catch (err) {
        if (isMounted) {
          console.error('Google Maps loading error:', err);
          setError('Failed to load Google Maps. Please check your API key and internet connection.');
          setLoading(false);
        }
      }
    };

    initMap();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [center, zoom, markers]);

  // Error state (conform best practices)
  if (error) {
    return (
      <div className={`${className} bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center p-6`}>
        <div className="text-center">
          <svg className="w-12 h-12 text-red-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Map Loading Error</h3>
          <p className="text-sm text-red-600">{error}</p>
          <a 
            href="/GOOGLE_MAPS_SETUP.md" 
            className="inline-block mt-4 text-sm text-red-700 underline hover:text-red-900"
          >
            View Setup Guide
          </a>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 mb-3"></div>
          <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  // Map container (conform documentației Google - div cu ID)
  return (
    <div 
      ref={mapRef} 
      className={className}
      aria-label="Google Map"
    />
  );
}
