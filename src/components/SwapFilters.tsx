'use client';

import { useState } from 'react';

export function SwapFilters() {
  const [filters, setFilters] = useState({
    whatIHave: '',
    whatIWant: '',
    category: 'toate',
    radius: '25',
    swapMode: 'local'
  });

  const categories = [
    { id: 'toate', name: 'Toate categoriile', icon: '📦' },
    { id: 'tech', name: 'Tech & Gadgets', icon: '💻' },
    { id: 'books', name: 'Cărți & Media', icon: '📚' },
    { id: 'jewelry', name: 'Bijuterii & Accesorii', icon: '💎' },
    { id: 'tools', name: 'Unelte & Echipamente', icon: '🔧' },
    { id: 'gaming', name: 'Gaming & Hobby', icon: '🎮' },
    { id: 'home', name: 'Casă & Grădină', icon: '🏠' }
  ];

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <h3 className="font-semibold text-gray-800 mb-4">🔍 Filtre de Căutare</h3>
      
      {/* What I Have */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🎯 Ce am de oferit:
        </label>
        <input
          type="text"
          value={filters.whatIHave}
          onChange={(e) => setFilters({...filters, whatIHave: e.target.value})}
          placeholder="ex: iPhone 12, laptop gaming..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* What I Want */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          🎯 Ce caut:
        </label>
        <input
          type="text"
          value={filters.whatIWant}
          onChange={(e) => setFilters({...filters, whatIWant: e.target.value})}
          placeholder="ex: MacBook, Samsung Galaxy..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Categories */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📋 Categorie:
        </label>
        <select
          value={filters.category}
          onChange={(e) => setFilters({...filters, category: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Radius */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          📍 Raza de căutare: {filters.radius}km
        </label>
        <input
          type="range"
          min="5"
          max="500"
          value={filters.radius}
          onChange={(e) => setFilters({...filters, radius: e.target.value})}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>5km</span>
          <span>100km</span>
          <span>500km</span>
        </div>
      </div>

      {/* Swap Mode */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          🚀 Modalitate schimb:
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="swapMode"
              value="local"
              checked={filters.swapMode === 'local'}
              onChange={(e) => setFilters({...filters, swapMode: e.target.value})}
              className="mr-2"
            />
            <span className="text-sm">📍 Întâlnire locală</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="swapMode"
              value="courier"
              checked={filters.swapMode === 'courier'}
              onChange={(e) => setFilters({...filters, swapMode: e.target.value})}
              className="mr-2"
            />
            <span className="text-sm">📦 Curier/Poștă</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="swapMode"
              value="vacation"
              checked={filters.swapMode === 'vacation'}
              onChange={(e) => setFilters({...filters, swapMode: e.target.value})}
              className="mr-2"
            />
            <span className="text-sm">🏖️ Swap + Vacanță</span>
          </label>
        </div>
      </div>

      {/* Search Button */}
      <button className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium">
        🔍 Caută Matches
      </button>

      {/* Quick Stats */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">📊 În zona ta:</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• 127 utilizatori activi</div>
          <div>• 348 obiecte disponibile</div>
          <div>• 23 matches potențiale</div>
        </div>
      </div>
    </div>
  );
}