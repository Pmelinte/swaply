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

export default function InteractiveMap({
  locations = ROMANIAN_LOCATIONS.map(loc => ({ ...loc, count: Math.floor(Math.random() * 50) + 1 })),
  onLocationSelect,
  showGestures = true,
  height = '400px'
}: MapComponentProps) {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [zoomLevel, setZoomLevel] = useState(MAP_SETTINGS.defaultZoom);
  const [center, setCenter] = useState(MAP_SETTINGS.defaultCenter);
  const [gestureHint, setGestureHint] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTouch, setLastTouch] = useState<{ x: number; y: number } | null>(null);

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

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setLastTouch({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && lastTouch) {
      const deltaX = e.clientX - lastTouch.x;
      const deltaY = e.clientY - lastTouch.y;
      
      // Simulăm mișcarea hărții
      setCenter(prev => ({
        lat: prev.lat - deltaY * 0.001,
        lng: prev.lng + deltaX * 0.001
      }));
      
      setLastTouch({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastTouch(null);
  };

  const getLocationColor = (type?: string) => {
    switch (type) {
      case 'user': return 'bg-blue-500';
      case 'object': return 'bg-green-500';
      case 'meeting': return 'bg-purple-500';
      default: return 'bg-red-500';
    }
  };

  const getLocationSize = (count?: number) => {
    if (!count) return 'w-3 h-3';
    if (count < 10) return 'w-4 h-4';
    if (count < 25) return 'w-5 h-5';
    return 'w-6 h-6';
  };

  return (
    <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Gesture Hint */}
      {gestureHint && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 bg-black bg-opacity-75 text-white px-4 py-2 rounded-full text-sm animate-pulse">
          {gestureHint}
        </div>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleZoomIn}
          className="w-10 h-10 bg-white shadow-lg rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ➕
        </button>
        <button
          onClick={handleZoomOut}
          className="w-10 h-10 bg-white shadow-lg rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ➖
        </button>
        <button
          onClick={() => {
            setCenter(MAP_SETTINGS.defaultCenter);
            setZoomLevel(MAP_SETTINGS.defaultZoom);
            setSelectedLocation(null);
          }}
          className="w-10 h-10 bg-white shadow-lg rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-colors text-xs"
        >
          🏠
        </button>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        className="relative overflow-hidden cursor-move select-none"
        style={{ height }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Map Background */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100"
          style={{
            backgroundImage: `
              radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 75% 75%, rgba(34, 197, 94, 0.1) 0%, transparent 50%),
              linear-gradient(45deg, rgba(147, 197, 253, 0.1) 25%, transparent 25%),
              linear-gradient(-45deg, rgba(167, 243, 208, 0.1) 25%, transparent 25%)
            `,
            backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px'
          }}
        />

        {/* Romania Outline */}
        <svg 
          className="absolute inset-0 w-full h-full opacity-20"
          viewBox="0 0 400 300"
          style={{ 
            transform: `scale(${zoomLevel / 6}) translate(${(MAP_SETTINGS.defaultCenter.lng - center.lng) * 10}px, ${(center.lat - MAP_SETTINGS.defaultCenter.lat) * 10}px)` 
          }}
        >
          <path
            d="M100,80 L120,60 L160,65 L180,45 L220,50 L250,40 L280,55 L300,80 L320,100 L310,140 L290,160 L270,180 L240,190 L200,185 L180,175 L150,170 L130,150 L110,130 Z"
            fill="rgba(59, 130, 246, 0.2)"
            stroke="rgba(59, 130, 246, 0.4)"
            strokeWidth="2"
          />
        </svg>

        {/* Location Markers */}
        {locations.map((location, index) => {
          const x = ((location.lng - 20) / 10) * 100; // Rough conversion for demo
          const y = ((48 - location.lat) / 5) * 100; // Rough conversion for demo
          
          return (
            <div
              key={index}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-125 ${
                selectedLocation?.name === location.name ? 'scale-150 z-10' : ''
              }`}
              style={{
                left: `${Math.max(5, Math.min(95, x))}%`,
                top: `${Math.max(5, Math.min(95, y))}%`,
                transform: `translate(-50%, -50%) scale(${zoomLevel / 6})`
              }}
              onClick={() => handleLocationClick(location)}
            >
              <div className={`rounded-full ${getLocationColor(location.type)} ${getLocationSize(location.count)} shadow-lg animate-pulse`} />
              {location.count && (
                <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {location.count > 99 ? '99+' : location.count}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Location Details Panel */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-xl p-4 z-20 max-w-sm mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-900">{selectedLocation.name}</h3>
            <button
              onClick={() => setSelectedLocation(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <div className="text-sm text-gray-600 mb-3">
            {selectedLocation.count ? `${selectedLocation.count} obiecte disponibile` : 'Locație selectată'}
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700 transition-colors">
              📍 Vezi Obiecte
            </button>
            <button className="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded-lg text-sm hover:bg-gray-200 transition-colors">
              🗺️ Direcții
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
        <div className="font-semibold text-gray-900 mb-2">Legendă:</div>
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

      {/* Distance Info */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs">
        <div className="font-semibold text-gray-900">📏 Zoom: {zoomLevel}x</div>
        <div className="text-gray-600">Centru: {center.lat.toFixed(2)}, {center.lng.toFixed(2)}</div>
      </div>
    </div>
  );
}