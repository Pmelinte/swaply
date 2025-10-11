'use client';

import { useState, useEffect } from 'react';

interface GoogleMapProps {
  locations?: Array<{
    name: string;
    lat: number;
    lng: number;
    count?: number;
    type?: 'user' | 'object' | 'meeting';
  }>;
  onLocationSelect?: (location: any) => void;
  height?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const DEFAULT_LOCATIONS = [
  { name: 'București', lat: 44.4268, lng: 26.1025, count: 127 },
  { name: 'Cluj-Napoca', lat: 46.7712, lng: 23.6236, count: 89 },
  { name: 'Timișoara', lat: 45.7489, lng: 21.2087, count: 64 },
  { name: 'Iași', lat: 47.1585, lng: 27.6014, count: 52 },
  { name: 'Constanța', lat: 44.1598, lng: 28.6348, count: 41 },
  { name: 'Craiova', lat: 44.3302, lng: 23.7949, count: 38 },
  { name: 'Brașov', lat: 45.6427, lng: 25.5887, count: 35 },
  { name: 'Galați', lat: 45.4353, lng: 28.0080, count: 29 }
];

export default function GoogleMap({
  locations = DEFAULT_LOCATIONS,
  onLocationSelect,
  height = '400px'
}: GoogleMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isEmbedLoaded, setIsEmbedLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLocationClick = (location: any) => {
    setSelectedLocation(location);
    if (onLocationSelect) {
      onLocationSelect(location);
    }
  };

  // Don't render until client-side
  if (!isClient) {
    return (
      <div className="relative bg-gray-50 rounded-lg overflow-hidden animate-pulse" style={{ height }}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Se încarcă harta...</h3>
          </div>
        </div>
      </div>
    );
  }

  // Create Google Maps embed URL for Romania
  const embedUrl = selectedLocation 
    ? `https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo'}&q=${encodeURIComponent(selectedLocation.name + ', Romania')}&zoom=12`
    : `https://www.google.com/maps/embed/v1/view?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || 'demo'}&center=45.9432,24.9668&zoom=6`;

  return (
    <div className="relative bg-gray-50 rounded-lg overflow-hidden" style={{ height }}>
      {/* Google Maps Embed */}
      {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
        <iframe
          src={embedUrl}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setIsEmbedLoaded(true)}
          className="absolute inset-0"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Hartă Interactivă România</h3>
            <p className="text-gray-600">Google Maps se va încărca aici</p>
            <p className="text-sm text-gray-500 mt-2">
              Configurează NEXT_PUBLIC_GOOGLE_MAPS_API_KEY pentru harta completă
            </p>
          </div>
        </div>
      )}

      {/* Location overlay with clickable pins */}
      <div className="absolute inset-0 pointer-events-none">
        {locations.map((location, index) => (
          <button
            key={index}
            onClick={() => handleLocationClick(location)}
            className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full shadow-lg border-2 border-blue-500 hover:border-blue-700 transition-all duration-200 hover:scale-110"
            style={{
              left: `${((location.lng - 20) / (30 - 20)) * 100}%`,
              top: `${((48 - location.lat) / (48 - 43)) * 100}%`,
            }}
            title={`${location.name} - ${location.count} obiecte`}
          >
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
              {location.count || index + 1}
            </div>
          </button>
        ))}
      </div>

      {/* Info panel */}
      <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 max-h-32 overflow-y-auto">
        {selectedLocation ? (
          <div>
            <h3 className="font-semibold text-lg text-gray-800">{selectedLocation.name}</h3>
            <p className="text-gray-600">{selectedLocation.count} obiecte disponibile pentru schimb</p>
            <button
              onClick={() => setSelectedLocation(null)}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              ← Înapoi la harta României
            </button>
          </div>
        ) : (
          <div>
            <h3 className="font-semibold text-gray-800">🇷🇴 Harta României</h3>
            <p className="text-sm text-gray-600">
              Apasă pe orașele marcate pentru a vedea obiectele disponibile
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {locations.slice(0, 4).map((loc, i) => (
                <button
                  key={i}
                  onClick={() => handleLocationClick(loc)}
                  className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full hover:bg-blue-200 transition-colors"
                >
                  {loc.name} ({loc.count})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}