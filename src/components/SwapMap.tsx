'use client';

import { useState, useEffect } from 'react';

type User = {
  id: number;
  name: string;
  location: string;
  items: string[];
  wants: string[];
  rating: number;
  avatar: string;
  distance: string;
  coordinates: { lat: number; lng: number };
};

export function SwapMap() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Mock data pentru utilizatori pe hartă
  const mockUsers = [
    {
      id: 1,
      name: 'Maria Popescu',
      location: 'Sector 1, București',
      items: ['MacBook Pro 2020', 'Canon EOS 90D'],
      wants: ['Gaming Laptop', 'iPhone 13'],
      rating: 4.9,
      avatar: 'MP',
      distance: '2.3km',
      coordinates: { lat: 44.4379, lng: 26.0945 }
    },
    {
      id: 2,
      name: 'Alexandru Ionescu',
      location: 'Sector 3, București',
      items: ['PlayStation 5', 'Bicicleta MTB'],
      wants: ['MacBook', 'Aparat foto'],
      rating: 4.7,
      avatar: 'AI',
      distance: '5.1km',
      coordinates: { lat: 44.4143, lng: 26.1117 }
    },
    {
      id: 3,
      name: 'Elena Stoica',
      location: 'Floreasca, București',
      items: ['iPhone 12', 'Kindle Oasis'],
      wants: ['Samsung Galaxy', 'Colecție cărți'],
      rating: 4.8,
      avatar: 'ES',
      distance: '3.7km',
      coordinates: { lat: 44.4756, lng: 26.0988 }
    }
  ];

  return (
    <div className="relative h-full">
      {/* Map Container */}
      <div className="h-full bg-gradient-to-br from-blue-100 to-green-100 relative overflow-hidden">
        {/* Map Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3B82F6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 z-10 space-y-2">
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
            <span className="text-lg">🔍</span>
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
            <span className="text-lg">📍</span>
          </button>
          <button className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50">
            <span className="text-lg">🌍</span>
          </button>
        </div>

        {/* User Markers */}
        {mockUsers.map((user, index) => (
          <div
            key={user.id}
            className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
              selectedUser?.id === user.id ? 'scale-125 z-20' : 'hover:scale-110 z-10'
            }`}
            style={{
              left: `${20 + index * 25}%`,
              top: `${30 + index * 20}%`
            }}
            onClick={() => setSelectedUser(selectedUser?.id === user.id ? null : user)}
          >
            {/* User Avatar Marker */}
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-4 border-white">
                {user.avatar}
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <span className="text-xs">📦</span>
              </div>
            </div>

            {/* User Info Popup */}
            {selectedUser?.id === user.id && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-30">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.location}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-500">★</span>
                      <span className="text-sm text-gray-600 ml-1">{user.rating}</span>
                      <span className="text-xs text-gray-500 ml-2">• {user.distance}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUser(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-green-700 mb-1">🎯 Oferă:</h4>
                    <div className="flex flex-wrap gap-1">
                      {user.items.map((item, idx) => (
                        <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-blue-700 mb-1">🔍 Caută:</h4>
                    <div className="flex flex-wrap gap-1">
                      {user.wants.map((item, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-2">
                    <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-blue-700">
                      💬 Trimite Mesaj
                    </button>
                    <button className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm hover:bg-green-700">
                      🔄 Propune Swap
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Map Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h4 className="font-medium text-gray-800 mb-2">📍 Legendă Hartă</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
              <span>Utilizator activ (online acum)</span>
            </div>
            <div className="flex items-center">
              <span className="text-lg mr-2">📦</span>
              <span>Are obiecte de schimbat</span>
            </div>
            <div className="flex items-center">
              <span className="text-lg mr-2">🔄</span>
              <span>Match potențial cu tine</span>
            </div>
          </div>
        </div>

        {/* Current Location */}
        <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}>
          <div className="relative">
            <div className="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
            <div className="absolute inset-0 w-6 h-6 bg-red-300 rounded-full animate-ping"></div>
          </div>
          <p className="text-xs text-center mt-1 text-gray-600 font-medium">Tu ești aici</p>
        </div>
      </div>
    </div>
  );
}