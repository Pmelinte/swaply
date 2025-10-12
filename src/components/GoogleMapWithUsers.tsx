'use client';

/**
 * METODA #3: @react-google-maps/api - Interactive Map with User Markers
 * Library populară, bine testată, cu suport TypeScript
 * Documentație: https://react-google-maps-api-docs.netlify.app/
 */

import { useCallback, useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

interface UserMarker {
  id: number;
  lat: number;
  lng: number;
  category: string;
  name: string;
}

interface GoogleMapWithUsersProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: UserMarker[];
  className?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

export default function GoogleMapWithUsers({
  center = { lat: 45.9432, lng: 24.9668 },
  zoom = 7,
  markers = [],
  className = 'w-full h-[400px] rounded-lg'
}: GoogleMapWithUsersProps) {
  const [selectedMarker, setSelectedMarker] = useState<UserMarker | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['geometry', 'places'],
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    console.log('✅ METODA #3: React Google Maps loaded');
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Category to emoji mapping
  const getCategoryEmoji = (category: string): string => {
    const emojiMap: Record<string, string> = {
      'sport': '⚽',
      'arta': '🎨',
      'it': '💻',
      'muzica': '🎵',
      'casa': '🏠',
      'toate': '🌍'
    };
    return emojiMap[category] || '📍';
  };

  // Category to color mapping
  const getCategoryColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      'sport': '#10B981', // green
      'arta': '#F59E0B', // amber
      'it': '#3B82F6', // blue
      'muzica': '#8B5CF6', // purple
      'casa': '#EF4444', // red
      'toate': '#6B7280' // gray
    };
    return colorMap[category] || '#6B7280';
  };

  if (loadError) {
    return (
      <div className={`${className} bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center`}>
        <div className="text-center p-4">
          <p className="text-red-600 font-semibold">❌ METODA #3 Failed</p>
          <p className="text-red-500 text-sm">Error loading Google Maps</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 mb-3"></div>
          <p className="text-gray-600 text-sm">⏳ Loading interactive map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="bg-green-100 border border-green-300 rounded px-3 py-1 text-sm text-green-800 flex items-center justify-between">
        <span>✅ METODA #3: @react-google-maps/api - Interactive Map</span>
        <span className="text-xs">{markers.length} utilizatori activi</span>
      </div>
      
      <div className={className}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={zoom}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
        >
          {/* Render user markers */}
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={{ lat: marker.lat, lng: marker.lng }}
              onClick={() => setSelectedMarker(marker)}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                fillColor: getCategoryColor(marker.category),
                fillOpacity: 0.8,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 10,
              }}
              title={marker.name}
            />
          ))}

          {/* Info window for selected marker */}
          {selectedMarker && (
            <InfoWindow
              position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
              onCloseClick={() => setSelectedMarker(null)}
            >
              <div className="p-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-2xl">{getCategoryEmoji(selectedMarker.category)}</span>
                  <h3 className="font-semibold text-gray-900">{selectedMarker.name}</h3>
                </div>
                <p className="text-sm text-gray-600 capitalize">
                  Categorie: {selectedMarker.category}
                </p>
                <button className="mt-2 text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                  Vezi profil
                </button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Sport</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span>Artă</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>IT</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-purple-500"></div>
          <span>Muzică</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Casă</span>
        </div>
      </div>
    </div>
  );
}
