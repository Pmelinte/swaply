'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MOCK_OBJECTS, MOCK_USERS, CATEGORIES, getUserById } from '@/lib/mock/database';
import { useSwipeGestures, useVisualFeedback } from '@/hooks/useGestures';
import { RippleEffect } from '@/components/GestureComponents';
import InteractiveMap from '@/components/InteractiveMap';

interface SwapObject {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  condition: 'nou' | 'ca_nou' | 'bun' | 'uzat';
  images: string[];
  user_id: string;
  location: string;
  coordinates: { lat: number; lng: number };
  created_at: string;
  interested_count: number;
  views_count: number;
  tags: string[];
  estimated_value: number;
  swap_preferences: string[];
}

// Date mock pentru demonstrație din noua bază de date
const filteredMockObjects = MOCK_OBJECTS.slice(0, 6); // Primele 6 obiecte

const CATEGORIES_LIST = Object.keys(CATEGORIES);

const CONDITIONS = [
  { value: 'toate', label: 'Toate stările' },
  { value: 'nou', label: '🆕 Nou' },
  { value: 'ca_nou', label: '✨ Ca nou' },
  { value: 'bun', label: '👍 Bună' },
  { value: 'uzat', label: '⚠️ Uzat' }
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevanță' },
  { value: 'newest', label: 'Cele mai noi' },
  { value: 'oldest', label: 'Cele mai vechi' },
  { value: 'interest', label: 'Cel mai popular' },
  { value: 'value', label: 'Valoare estimată' }
];

export default function ObiecteePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toate');
  const [selectedCondition, setSelectedCondition] = useState('toate');
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showMap, setShowMap] = useState(false);

  const filteredObjects = filteredMockObjects
    .filter(obj => {
      const matchesSearch = searchQuery === '' || 
        obj.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        obj.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'Toate' || obj.category === selectedCategory;
      
      const matchesCondition = selectedCondition === 'toate' || obj.condition === selectedCondition;
      
      return matchesSearch && matchesCategory && matchesCondition;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'interest':
          return b.interested_count - a.interested_count;
        case 'value':
          return b.estimated_value - a.estimated_value;
        default:
          return 0;
      }
    });

  const getTimeAgo = (dateString: string) => {
    const now = new Date().getTime();
    const objTime = new Date(dateString).getTime();
    const diffDays = Math.floor((now - objTime) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Azi';
    if (diffDays === 1) return 'Ieri';
    if (diffDays < 7) return `${diffDays} zile`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} săptămâni`;
    return `${Math.floor(diffDays / 30)} luni`;
  };

  const getConditionBadge = (condition: string) => {
    const configs = {
      nou: { label: '🆕 Nou', color: 'bg-green-100 text-green-800' },
      ca_nou: { label: '✨ Ca nou', color: 'bg-blue-100 text-blue-800' },
      bun: { label: '👍 Bună', color: 'bg-yellow-100 text-yellow-800' },
      uzat: { label: '⚠️ Uzat', color: 'bg-orange-100 text-orange-800' }
    };
    return configs[condition as keyof typeof configs] || configs.bun;
  };

  const getMatchScore = (object: SwapObject) => {
    // Simulăm un scor de compatibilitate bazat pe popularitate și valoare
    const popularityScore = Math.min(object.interested_count * 3, 50);
    const valueScore = Math.min(object.estimated_value / 100, 40);
    const randomBonus = Math.floor(Math.random() * 10);
    return Math.min(Math.floor(popularityScore + valueScore + randomBonus), 99);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📦 Explorează Obiecte
          </h1>
          <p className="text-gray-600">
            Descoperă obiectele perfecte pentru schimb
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Caută obiecte..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                🔍
              </div>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categorie
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Toate">Toate</option>
                {CATEGORIES_LIST.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Condition Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starea
              </label>
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {CONDITIONS.map(condition => (
                  <option key={condition.value} value={condition.value}>
                    {condition.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sortează
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vizualizare
              </label>
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 py-2 px-3 text-sm ${
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📋 Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 py-2 px-3 text-sm ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📄 Lista
                </button>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Găsite {filteredObjects.length} obiecte
            </div>
            <Link
              href="/obiecte/nou"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              ➕ Adaugă obiect
            </Link>
          </div>
        </div>

        {/* Results */}
        {filteredObjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nu am găsit obiecte
            </h3>
            <p className="text-gray-500 mb-6">
              Încearcă să modifici criteriile de căutare
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Toate');
                setSelectedCondition('toate');
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 Resetează filtrele
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-6'
          }>
            {filteredObjects.map((object) => {
              const conditionBadge = getConditionBadge(object.condition);
              const user = getUserById(object.user_id);
              const matchScore = getMatchScore(object);
              
              if (viewMode === 'list') {
                return (
                  <div key={object.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="flex">
                      {/* Image */}
                      <div className="w-48 h-48 relative">
                        <img
                          src={object.images[0]}
                          alt={object.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-green-600 text-white px-2 py-1 rounded-full text-sm font-medium">
                          {matchScore}% match
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{object.title}</h3>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${conditionBadge.color}`}>
                            {conditionBadge.label}
                          </div>
                        </div>

                        <p className="text-gray-600 mb-4 line-clamp-2">{object.description}</p>

                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                              {user?.avatar || 'U'}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user?.name || 'Utilizator'}</div>
                              <div className="text-xs text-gray-500">
                                ⭐ {user?.rating || 4.5} • {user?.total_swaps || 0} schimburi
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            📍 {object.location}
                          </div>
                          <div className="text-sm text-gray-500">
                            🕒 {getTimeAgo(object.created_at)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            👥 {object.interested_count} interesați • 💰 {object.estimated_value} RON
                          </div>
                          <div className="flex gap-2">
                            <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                              💬 Contactează
                            </button>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                              🔄 Propune schimb
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div key={object.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                  {/* Image */}
                  <div className="relative h-64">
                    <img
                      src={object.images[0]}
                      alt={object.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-green-600 text-white px-2 py-1 rounded-full text-sm font-medium">
                      {matchScore}% match
                    </div>
                    <div className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${conditionBadge.color}`}>
                      {conditionBadge.label}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{object.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{object.description}</p>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                        {user?.avatar || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{user?.name || 'Utilizator'}</div>
                        <div className="text-xs text-gray-500">
                          ⭐ {user?.rating || 4.5} • {user?.total_swaps || 0} schimburi
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 mb-4">
                      <div>📍 {object.location}</div>
                      <div>🕒 {getTimeAgo(object.created_at)} • 👥 {object.interested_count} interesați</div>
                      <div>💰 Valoare estimată: {object.estimated_value} RON</div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm">
                        💬 Contactează
                      </button>
                      <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        🔄 Schimb
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}