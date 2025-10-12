'use client';

/**
 * Matching Route Map - Hartă pentru vizualizarea rutei dintre 2 useri care fac swap
 * Afișează: marker user 1, marker user 2, ruta optimă, distanță, timp estimat
 * Folosește: @react-google-maps/api cu DirectionsService și DirectionsRenderer
 */

import { useCallback, useEffect, useState } from 'react';
import { GoogleMap, Marker, DirectionsRenderer, InfoWindow, useJsApiLoader } from '@react-google-maps/api';

interface UserLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  avatar?: string;
  category?: string;
  itemName?: string; // Obiectul oferit
}

interface MatchingRouteMapProps {
  user1: UserLocation;
  user2: UserLocation;
  showAlternativeRoutes?: boolean; // Arată multiple rute
  travelMode?: 'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT';
  className?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: true,
  streetViewControl: false,
  fullscreenControl: true,
};

// Directii pentru rutele alternative
const libraries: ("geometry" | "places" | "drawing")[] = ["geometry", "places"];

export default function MatchingRouteMap({
  user1,
  user2,
  showAlternativeRoutes = false,
  travelMode = 'DRIVING',
  className = 'w-full h-[500px] rounded-lg'
}: MatchingRouteMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [alternativeRoutes, setAlternativeRoutes] = useState<google.maps.DirectionsResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null);
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
    midpoint?: { lat: number; lng: number };
  } | null>(null);

  // Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries as any,
  });

  // Calculate route between two users
  useEffect(() => {
    if (!isLoaded || !map) return;

    const directionsService = new google.maps.DirectionsService();

    // Request principal cu ruta optimă
    directionsService.route(
      {
        origin: { lat: user1.lat, lng: user1.lng },
        destination: { lat: user2.lat, lng: user2.lng },
        travelMode: google.maps.TravelMode[travelMode],
        provideRouteAlternatives: showAlternativeRoutes,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          setDirectionsResponse(result);

          // Extract route info
          const route = result.routes[0];
          if (route && route.legs[0]) {
            const leg = route.legs[0];
            setRouteInfo({
              distance: leg.distance?.text || 'N/A',
              duration: leg.duration?.text || 'N/A',
            });

            // Calculate midpoint
            if (leg.steps && leg.steps.length > 0) {
              const midIndex = Math.floor(leg.steps.length / 2);
              const midStep = leg.steps[midIndex];
              setRouteInfo(prev => ({
                ...prev!,
                midpoint: {
                  lat: midStep.start_location.lat(),
                  lng: midStep.start_location.lng(),
                }
              }));
            }
          }

          // Salvează rutele alternative
          if (showAlternativeRoutes && result.routes.length > 1) {
            setAlternativeRoutes(result.routes.slice(1).map(route => ({
              ...result,
              routes: [route]
            })));
          }
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  }, [isLoaded, map, user1, user2, travelMode, showAlternativeRoutes]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    console.log('✅ Matching Route Map loaded');
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  // Category to color mapping (pentru markers)
  const getCategoryColor = (category?: string): string => {
    const colorMap: Record<string, string> = {
      'sport': '#10B981',
      'arta': '#F59E0B',
      'it': '#3B82F6',
      'muzica': '#8B5CF6',
      'casa': '#EF4444',
    };
    return colorMap[category || ''] || '#6B7280';
  };

  const getCategoryEmoji = (category?: string): string => {
    const emojiMap: Record<string, string> = {
      'sport': '⚽',
      'arta': '🎨',
      'it': '💻',
      'muzica': '🎵',
      'casa': '🏠',
    };
    return emojiMap[category || ''] || '📍';
  };

  const getTravelModeIcon = (mode: string): string => {
    const iconMap: Record<string, string> = {
      'DRIVING': '🚗',
      'WALKING': '🚶',
      'BICYCLING': '🚴',
      'TRANSIT': '🚌',
    };
    return iconMap[mode] || '🚗';
  };

  if (loadError) {
    return (
      <div className={`${className} bg-red-50 border-2 border-red-200 rounded-lg flex items-center justify-center`}>
        <div className="text-center p-4">
          <p className="text-red-600 font-semibold">❌ Matching Map Failed</p>
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
          <p className="text-gray-600 text-sm">⏳ Calculăm ruta optimă...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header cu info useri */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getCategoryEmoji(user1.category)}</span>
              <div>
                <p className="font-semibold text-gray-900">{user1.name}</p>
                {user1.itemName && (
                  <p className="text-xs text-gray-600">Oferă: {user1.itemName}</p>
                )}
              </div>
            </div>
            
            <span className="text-2xl">↔️</span>
            
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getCategoryEmoji(user2.category)}</span>
              <div>
                <p className="font-semibold text-gray-900">{user2.name}</p>
                {user2.itemName && (
                  <p className="text-xs text-gray-600">Oferă: {user2.itemName}</p>
                )}
              </div>
            </div>
          </div>

          {routeInfo && (
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">
                {getTravelModeIcon(travelMode)} {routeInfo.distance}
              </p>
              <p className="text-xs text-gray-600">⏱️ {routeInfo.duration}</p>
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className={className}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={{
            lat: (user1.lat + user2.lat) / 2,
            lng: (user1.lng + user2.lng) / 2,
          }}
          zoom={8}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={mapOptions}
        >
          {/* Ruta principală */}
          {directionsResponse && (
            <DirectionsRenderer
              directions={directionsResponse}
              options={{
                polylineOptions: {
                  strokeColor: '#3B82F6',
                  strokeWeight: 5,
                  strokeOpacity: 0.8,
                },
                suppressMarkers: true, // Folosim markeri custom
              }}
            />
          )}

          {/* Rute alternative */}
          {alternativeRoutes.map((route, index) => (
            <DirectionsRenderer
              key={`alt-route-${index}`}
              directions={route}
              options={{
                polylineOptions: {
                  strokeColor: '#9CA3AF',
                  strokeWeight: 3,
                  strokeOpacity: 0.5,
                },
                suppressMarkers: true,
              }}
            />
          ))}

          {/* Marker User 1 */}
          <Marker
            position={{ lat: user1.lat, lng: user1.lng }}
            onClick={() => setSelectedUser(user1)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: getCategoryColor(user1.category),
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 12,
            }}
            label={{
              text: '1',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          />

          {/* Marker User 2 */}
          <Marker
            position={{ lat: user2.lat, lng: user2.lng }}
            onClick={() => setSelectedUser(user2)}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              fillColor: getCategoryColor(user2.category),
              fillOpacity: 1,
              strokeColor: '#ffffff',
              strokeWeight: 3,
              scale: 12,
            }}
            label={{
              text: '2',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 'bold',
            }}
          />

          {/* Midpoint marker (punct de întâlnire sugerare) */}
          {routeInfo?.midpoint && (
            <Marker
              position={routeInfo.midpoint}
              icon={{
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                fillColor: '#F59E0B',
                fillOpacity: 0.8,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 6,
                rotation: 90,
              }}
              title="Punct de întâlnire sugerare"
            />
          )}

          {/* Info Window pentru user selectat */}
          {selectedUser && (
            <InfoWindow
              position={{ lat: selectedUser.lat, lng: selectedUser.lng }}
              onCloseClick={() => setSelectedUser(null)}
            >
              <div className="p-2">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-2xl">{getCategoryEmoji(selectedUser.category)}</span>
                  <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                </div>
                {selectedUser.itemName && (
                  <p className="text-sm text-gray-600">
                    Oferă: <span className="font-medium">{selectedUser.itemName}</span>
                  </p>
                )}
                {selectedUser.category && (
                  <p className="text-xs text-gray-500 capitalize mt-1">
                    Categorie: {selectedUser.category}
                  </p>
                )}
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>

      {/* Route details panel */}
      {routeInfo && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{routeInfo.distance}</p>
              <p className="text-xs text-gray-600">Distanță</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{routeInfo.duration}</p>
              <p className="text-xs text-gray-600">Timp estimat</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{getTravelModeIcon(travelMode)}</p>
              <p className="text-xs text-gray-600 capitalize">{travelMode.toLowerCase()}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">
                {showAlternativeRoutes && alternativeRoutes.length > 0 
                  ? `${alternativeRoutes.length + 1}` 
                  : '1'}
              </p>
              <p className="text-xs text-gray-600">
                {alternativeRoutes.length > 0 ? 'Rute disponibile' : 'Rută optimă'}
              </p>
            </div>
          </div>

          {/* Legend pentru rute */}
          {showAlternativeRoutes && alternativeRoutes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Legend:</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-1 bg-blue-500 rounded"></div>
                  <span>Rută recomandată</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-1 bg-gray-400 rounded"></div>
                  <span>Rute alternative</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span>Punct de întâlnire sugerare</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
