'use client';

import { useEffect, useLayoutEffect, useState, useRef } from 'react';

declare global {
  interface Window {
    google: typeof google;
    initMap?: () => void;
  }
}

interface Location {
  id?: number;
  name: string;
  lat: number;
  lng: number;
  count?: number;
  type?: 'user' | 'object' | 'meeting';
  description?: string;
}

interface RealGoogleMapProps {
  locations?: Location[];
  onLocationSelect?: (location: Location) => void;
  height?: string;
  center?: { lat: number; lng: number };
  zoom?: number;
  apiKey?: string;
}

const DEFAULT_LOCATIONS: Location[] = [
  { id: 1, name: 'București', lat: 44.4268, lng: 26.1025, count: 127, description: '127 obiecte disponibile' },
  { id: 2, name: 'Cluj-Napoca', lat: 46.7712, lng: 23.6236, count: 89, description: '89 obiecte disponibile' },
  { id: 3, name: 'Timișoara', lat: 45.7489, lng: 21.2087, count: 64, description: '64 obiecte disponibile' },
  { id: 4, name: 'Iași', lat: 47.1585, lng: 27.6014, count: 52, description: '52 obiecte disponibile' },
  { id: 5, name: 'Constanța', lat: 44.1598, lng: 28.6348, count: 41, description: '41 obiecte disponibile' },
  { id: 6, name: 'Craiova', lat: 44.3302, lng: 23.7949, count: 38, description: '38 obiecte disponibile' },
  { id: 7, name: 'Brașov', lat: 45.6427, lng: 25.5887, count: 35, description: '35 obiecte disponibile' },
  { id: 8, name: 'Galați', lat: 45.4353, lng: 28.0080, count: 29, description: '29 obiecte disponibile' },
];

const DEFAULT_CENTER = { lat: 45.9432, lng: 24.9668 }; // Center of Romania
const DEFAULT_ZOOM = 7;

export default function RealGoogleMap({
  locations = DEFAULT_LOCATIONS,
  onLocationSelect,
  height = '500px',
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
}: RealGoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  // Check if API key is valid (not placeholder)
  const hasValidApiKey = apiKey && apiKey !== 'your_api_key_here' && apiKey.length > 20;

  // Debug: Log API key status
  console.log('🗺️ RealGoogleMap - API Key:', apiKey ? `${apiKey.substring(0, 10)}... (length: ${apiKey.length})` : 'MISSING');
  console.log('🗺️ RealGoogleMap - hasValidApiKey:', hasValidApiKey);

  // Initialize Google Maps
  useEffect(() => {
    // Early returns for invalid states
    if (!apiKey) {
      setError('Google Maps API key lipsește');
      setIsLoading(false);
      return;
    }
    
    if (!hasValidApiKey) {
      console.log('⚠️ Invalid API key, showing fallback UI');
      setIsLoading(false);
      return;
    }

    if (!mapRef.current) {
      console.log('⏳ mapRef.current is null, waiting for DOM...');
      // Schedule a retry
      const timer = setTimeout(() => {
        console.log('🔄 Retrying map initialization...');
        setIsLoading(prev => prev); // Force re-render
      }, 100);
      return () => clearTimeout(timer);
    }

    const mapElement = mapRef.current;
    console.log('🗺️ Initializing Google Maps... mapElement:', mapElement);

    const initMap = () => {
      try {
        console.log('�️ Creating map instance with google.maps...');
        
        if (!window.google || !window.google.maps) {
          console.log('⚠️ Google Maps not loaded yet, will retry...');
          return;
        }
        
        if (!mapRef.current) return;

        const googleMap = new google.maps.Map(mapRef.current, {
          center: center,
          zoom: zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        console.log('✅ Map created successfully!');
        setMap(googleMap);
        setIsLoading(false);
      } catch (err: unknown) {
        console.error('❌ Error creating Google Maps:', err);
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(`Eroare la încărcarea Google Maps: ${errorMsg}`);
        setIsLoading(false);
      }
    };

    // Load Google Maps script
    if (!window.google) {
      console.log('📦 Loading Google Maps script...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        console.log('✅ Google Maps script loaded successfully');
        initMap();
      };
      script.onerror = () => {
        console.error('❌ Failed to load Google Maps script');
        setError('Failed to load Google Maps. Check your API key and internet connection.');
        setIsLoading(false);
      };
      document.head.appendChild(script);
    } else {
      console.log('✅ Google Maps already loaded, initializing...');
      initMap();
    }
  }, [apiKey, center, zoom, hasValidApiKey]);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markers.forEach((marker) => marker.setMap(null));
    setMarkers([]);

    const newMarkers: google.maps.Marker[] = [];
    const infoWindow = new google.maps.InfoWindow();

    locations.forEach((location) => {
      const marker = new google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3B82F6',
          fillOpacity: 0.9,
          strokeColor: '#1E40AF',
          strokeWeight: 2,
        },
        label: {
          text: String(location.count || ''),
          color: 'white',
          fontSize: '12px',
          fontWeight: 'bold',
        },
        animation: google.maps.Animation.DROP,
      });

      marker.addListener('click', () => {
        const content = `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; font-size: 18px; font-weight: bold; color: #1F2937;">
              ${location.name}
            </h3>
            <p style="margin: 0 0 8px 0; color: #4B5563;">
              ${location.description || location.count + ' obiecte disponibile'}
            </p>
            <button 
              onclick="window.dispatchEvent(new CustomEvent('locationSelect', { detail: ${JSON.stringify(location)} }))"
              style="
                background: #3B82F6; 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 6px; 
                cursor: pointer;
                font-weight: 500;
              "
            >
              Vezi obiecte →
            </button>
          </div>
        `;

        infoWindow.setContent(content);
        infoWindow.open(map, marker);
        
        setSelectedLocation(location);
        if (onLocationSelect) {
          onLocationSelect(location);
        }
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Fit map to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      locations.forEach((loc) => bounds.extend({ lat: loc.lat, lng: loc.lng }));
      map.fitBounds(bounds);
      
      // Don't zoom in too much
      google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
        const currentZoom = map.getZoom();
        if (currentZoom && currentZoom > 12) {
          map.setZoom(12);
        }
      });
    }

    // Listen for custom location select events
    const handleLocationSelect = (event: any) => {
      const location = event.detail;
      if (onLocationSelect) {
        onLocationSelect(location);
      }
    };

    window.addEventListener('locationSelect', handleLocationSelect);

    return () => {
      window.removeEventListener('locationSelect', handleLocationSelect);
    };
  }, [map, locations, onLocationSelect]);

  if (isLoading) {
    return (
      <div
        className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🗺️</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Se încarcă Google Maps...</h3>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-100"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="relative bg-red-50 rounded-lg overflow-hidden flex items-center justify-center border-2 border-red-200"
        style={{ height }}
      >
        <div className="text-center p-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-800 mb-2">Eroare Google Maps</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="bg-white rounded-lg p-4 text-left text-sm">
            <p className="font-mono text-gray-700 mb-2">
              Adaugă în <strong>.env.local</strong>:
            </p>
            <code className="block bg-gray-100 p-2 rounded">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
            </code>
            <a
              href="https://developers.google.com/maps/documentation/javascript/get-api-key"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 mt-2 inline-block"
            >
              → Obține API Key gratuit
            </a>
          </div>
        </div>
      </div>
    );
  }
  
  // Fallback UI when API key is placeholder
  if (!map && !isLoading && !error) {
    return (
      <div
        className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg overflow-hidden border-2 border-blue-200"
        style={{ height }}
      >
        {/* Simple Romania Map Background */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center p-6 max-w-2xl">
            <div className="text-6xl mb-4">🗺️</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Harta Google Maps
            </h3>
            <p className="text-gray-600 mb-4">
              Pentru a vedea harta interactivă, configurează un API key gratuit Google Maps.
            </p>
            
            {/* Display locations as list */}
            <div className="bg-white rounded-lg shadow-lg p-6 text-left max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">📍</span>
                Locații active ({locations.length})
              </h4>
              <div className="space-y-3">
                {locations.map((location, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedLocation(location);
                      onLocationSelect?.(location);
                    }}
                    className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    <div className="font-semibold text-gray-800 flex items-center justify-between">
                      <span>{location.name}</span>
                      {location.count && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                          {location.count} {location.count === 1 ? 'utilizator' : 'utilizatori'}
                        </span>
                      )}
                    </div>
                    {location.description && (
                      <p className="text-sm text-gray-600 mt-1">{location.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Setup Instructions */}
            <div className="mt-6 bg-blue-50 rounded-lg p-4 text-sm">
              <p className="font-semibold text-blue-900 mb-2">
                🔑 Cum obții API Key gratuit (5 minute):
              </p>
              <ol className="text-left space-y-1 text-blue-800">
                <li>1. Intră pe <a href="https://console.cloud.google.com" target="_blank" rel="noopener" className="underline">console.cloud.google.com</a></li>
                <li>2. Creează un proiect nou</li>
                <li>3. Activează "Maps JavaScript API"</li>
                <li>4. Creează credențiale → API Key</li>
                <li>5. Adaugă în .env.local: <code className="bg-white px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code></li>
                <li>6. Restartează serverul: <code className="bg-white px-1 rounded">npm run dev</code></li>
              </ol>
              <p className="text-xs text-blue-600 mt-3">
                💡 Google oferă $200 credit/lună gratuit (~28,000 map loads)
              </p>
            </div>
          </div>
        </div>
        
        {/* Selected Location Info */}
        {selectedLocation && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-md mx-auto">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-800">{selectedLocation.name}</h3>
                <p className="text-gray-600 text-sm">{selectedLocation.description}</p>
                <p className="text-xs text-gray-400 mt-2">
                  📍 {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                </p>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="ml-2 text-gray-400 hover:text-gray-600 text-xl"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden shadow-lg" style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Info Panel */}
      {selectedLocation && (
        <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-md">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-800">{selectedLocation.name}</h3>
              <p className="text-gray-600 text-sm">{selectedLocation.description}</p>
            </div>
            <button
              onClick={() => setSelectedLocation(null)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
