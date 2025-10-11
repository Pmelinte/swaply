'use client';

import { useState, useEffect, useRef } from 'react';
import { MAP_SETTINGS, ROMANIAN_LOCATIONS, GESTURE_HINTS } from '@/lib/mock/database';

interface MapComponentProps {
  locations?: Array<{
    name: string;
    lat: number;
    lng: number;
    count?: number;
    type?: 'user' | 'object' | 'meeting';
  }>;
  onLocationSelect?: (location: any) => void;
  showGestures?: boolean;
  height?: string;
}

// Generate consistent count values for locations to avoid hydration issues
const getLocationWithCounts = () => {
  return ROMANIAN_LOCATIONS.map((loc, index) => ({ 
    ...loc, 
    count: (index * 7 + 13) % 50 + 1 // Deterministic count based on index
  }));
};

export default function InteractiveMap({
  locations = getLocationWithCounts(),
  onLocationSelect,
  showGestures = true,
  height = '400px'
}: MapComponentProps) {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(MAP_SETTINGS.defaultZoom);
  const [center, setCenter] = useState(MAP_SETTINGS.defaultCenter);
  const [gestureHint, setGestureHint] = useState('');
  const [isClient, setIsClient] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (showGestures) {
      const interval = setInterval(() => {
        const randomHint = GESTURE_HINTS[Math.floor(Math.random() * GESTURE_HINTS.length)];
        setGestureHint(randomHint);
        setTimeout(() => setGestureHint(''), 3000);
      }, 8000);

      return () => clearInterval(interval);
    }
  }, [showGestures]);

  const handleLocationClick = (location: any) => {
    setSelectedLocation(location);
    setCenter({ lat: location.lat, lng: location.lng });
    setZoomLevel(10);
    onLocationSelect?.(location);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 1, 4));
  };

  if (!isClient) {
    return (
      <div 
        className="w-full bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-gray-500">Se încarcă harta...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {/* Map Container with realistic styling */}
      <div
        ref={mapRef}
        className="relative overflow-hidden rounded-lg border border-gray-300"
        style={{ height }}
      >
        {/* Realistic Map Background */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundColor: '#E8F4FD',
            backgroundImage: `
              linear-gradient(0deg, #c8e6c9 0%, #e8f5e8 40%, #fff3e0 60%, #fce4ec 100%),
              radial-gradient(circle at 30% 30%, rgba(76, 175, 80, 0.1) 0%, transparent 40%),
              radial-gradient(circle at 70% 70%, rgba(33, 150, 243, 0.1) 0%, transparent 40%)
            `,
          }}
        />

        {/* Roads/Rivers simulation */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-30"
          viewBox="0 0 400 300"
        >
          <path
            d="M50,150 Q200,100 350,150"
            stroke="#4FC3F7"
            strokeWidth="3"
            fill="none"
            opacity="0.6"
          />
          <path
            d="M100,80 Q250,200 380,120"
            stroke="#81C784"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
          />
          <path
            d="M20,200 Q180,50 300,250"
            stroke="#FFB74D"
            strokeWidth="1"
            fill="none"
            opacity="0.3"
          />
        </svg>

        {/* Romania Outline - more realistic */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-25"
          viewBox="0 0 400 300"
        >
          <path
            d="M120,90 L140,70 L180,75 L200,55 L240,60 L270,50 L300,65 L320,90 L340,110 L330,150 L310,170 L290,190 L260,200 L220,195 L200,185 L170,180 L150,160 L130,140 Z"
            fill="rgba(139, 195, 74, 0.2)"
            stroke="rgba(139, 195, 74, 0.6)"
            strokeWidth="2"
          />
        </svg>

        {/* Cities/Location Markers with realistic positioning */}
        {locations.map((location, index) => {
          // More realistic positioning for Romanian cities
          let x, y;
          switch (location.name) {
            case 'București':
              x = 65; y = 75;
              break;
            case 'Cluj-Napoca':
              x = 45; y = 35;
              break;
            case 'Iași':
              x = 75; y = 25;
              break;
            case 'Constanța':
              x = 85; y = 70;
              break;
            case 'Timișoara':
              x = 25; y = 55;
              break;
            case 'Brașov':
              x = 58; y = 50;
              break;
            default:
              x = 30 + (index * 13) % 60;
              y = 25 + (index * 17) % 50;
          }
          
          return (
            <div
              key={`${location.name}-${index}`}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-125 group ${
                selectedLocation?.name === location.name ? 'scale-150 z-20' : 'z-10'
              }`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
              }}
              onClick={() => handleLocationClick(location)}
            >
              {/* Location Pin */}
              <div className="relative">
                <div className={`w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-xs font-bold text-white bg-red-500`}>
                  {location.count || 1}
                </div>
                
                {/* Location Name Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                    {location.name}
                    {location.count && (
                      <span className="ml-1 text-gray-300">({location.count} obiecte)</span>
                    )}
                  </div>
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-black"></div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2 z-30">
          <button
            onClick={handleZoomIn}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border"
          >
            <span className="text-xl font-bold text-gray-600">+</span>
          </button>
          <button
            onClick={handleZoomOut}
            className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors border"
          >
            <span className="text-xl font-bold text-gray-600">−</span>
          </button>
        </div>

        {/* Zoom Level Display */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 text-sm font-medium text-gray-700 border">
          Zoom: {zoomLevel}x
        </div>

        {/* Center Coordinates */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 text-xs text-gray-600 border">
          Centru: {center.lat.toFixed(2)}, {center.lng.toFixed(2)}
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-3 text-xs border">
          <div className="font-medium text-gray-800 mb-2">Legendă:</div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-600">Locații generale</span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600">Utilizatori activi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Obiecte disponibile</span>
          </div>
        </div>

        {/* Gesture Hints */}
        {gestureHint && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-sm z-40">
            {gestureHint}
          </div>
        )}

        {/* Selected Location Info */}
        {selectedLocation && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 border z-40 max-w-xs">
            <h3 className="font-bold text-gray-900">{selectedLocation.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {selectedLocation.count} obiecte disponibile pentru schimb
            </p>
            <button
              onClick={() => setSelectedLocation(null)}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}