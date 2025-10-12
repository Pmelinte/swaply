'use client';

/**
 * Demo page pentru MatchingRouteMap
 * Testează ruta dintre 2 useri care fac swap
 */

import { useState } from 'react';
import MatchingRouteMap from '@/components/MatchingRouteMap';

const mockUsers = {
  bucuresti: {
    id: '1',
    name: 'Ana Popescu',
    lat: 44.4268,
    lng: 26.1025,
    category: 'it',
    itemName: 'Laptop Dell XPS 15',
  },
  cluj: {
    id: '2',
    name: 'Mihai Ionescu',
    lat: 46.7712,
    lng: 23.6236,
    category: 'sport',
    itemName: 'Bicicletă MTB',
  },
  timisoara: {
    id: '3',
    name: 'Elena Dumitrescu',
    lat: 45.7489,
    lng: 21.2087,
    category: 'muzica',
    itemName: 'Chitară electrică Fender',
  },
  iasi: {
    id: '4',
    name: 'Andrei Stoica',
    lat: 47.1585,
    lng: 27.6014,
    category: 'arta',
    itemName: 'Set picturi acuarelă',
  },
};

const travelModes: Array<'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT'> = [
  'DRIVING',
  'WALKING', 
  'BICYCLING',
  'TRANSIT'
];

export default function MatchingDemoPage() {
  const [user1City, setUser1City] = useState<keyof typeof mockUsers>('bucuresti');
  const [user2City, setUser2City] = useState<keyof typeof mockUsers>('cluj');
  const [travelMode, setTravelMode] = useState<'DRIVING' | 'WALKING' | 'BICYCLING' | 'TRANSIT'>('DRIVING');
  const [showAlternatives, setShowAlternatives] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🗺️ Matching Route Map Demo
          </h1>
          <p className="text-gray-600">
            Vizualizează ruta optimă dintre 2 useri care fac swap
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User 1 Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                👤 User 1 (Oferă)
              </label>
              <select
                value={user1City}
                onChange={(e) => setUser1City(e.target.value as keyof typeof mockUsers)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(mockUsers).map(([city, user]) => (
                  <option key={city} value={city}>
                    {user.name} - {city} ({user.itemName})
                  </option>
                ))}
              </select>
            </div>

            {/* User 2 Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                👤 User 2 (Primește)
              </label>
              <select
                value={user2City}
                onChange={(e) => setUser2City(e.target.value as keyof typeof mockUsers)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(mockUsers).map(([city, user]) => (
                  <option key={city} value={city}>
                    {user.name} - {city} ({user.itemName})
                  </option>
                ))}
              </select>
            </div>

            {/* Travel Mode Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🚗 Mod de transport
              </label>
              <div className="grid grid-cols-2 gap-2">
                {travelModes.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setTravelMode(mode)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      travelMode === mode
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {mode === 'DRIVING' && '🚗 Mașină'}
                    {mode === 'WALKING' && '🚶 Pe jos'}
                    {mode === 'BICYCLING' && '🚴 Bicicletă'}
                    {mode === 'TRANSIT' && '🚌 Transport'}
                  </button>
                ))}
              </div>
            </div>

            {/* Alternative Routes Toggle */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🛣️ Opțiuni rută
              </label>
              <button
                onClick={() => setShowAlternatives(!showAlternatives)}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  showAlternatives
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showAlternatives ? '✅ Rute alternative active' : '⚪ Arată doar ruta optimă'}
              </button>
            </div>
          </div>
        </div>

        {/* Map Component */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <MatchingRouteMap
            user1={mockUsers[user1City]}
            user2={mockUsers[user2City]}
            travelMode={travelMode}
            showAlternativeRoutes={showAlternatives}
            className="w-full h-[600px] rounded-lg"
          />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📍 Markers</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Marker 1: {mockUsers[user1City].name}</li>
              <li>• Marker 2: {mockUsers[user2City].name}</li>
              <li>• Punct întâlnire (galben): La jumătatea rutei</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">🛣️ Rute</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Linie albastră: Rută recomandată</li>
              <li>• Linii gri: Rute alternative</li>
              <li>• Click pe markers pentru detalii</li>
            </ul>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-900 mb-2">⚙️ Features</h3>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Distanță & timp real (Google)</li>
              <li>• 4 moduri de transport</li>
              <li>• Zoom, pan, fullscreen</li>
            </ul>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold text-amber-900 mb-3 flex items-center space-x-2">
            <span>💡</span>
            <span>Cum să folosești:</span>
          </h3>
          <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
            <li>Selectează cei 2 useri din dropdown-urile de sus</li>
            <li>Alege modul de transport (mașină, pe jos, bicicletă, transport public)</li>
            <li>Activează "Rute alternative" pentru a vedea mai multe opțiuni</li>
            <li>Click pe markers pentru a vedea detalii despre fiecare user</li>
            <li>Punctul galben indică jumătatea rutei (punct de întâlnire sugerare)</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
