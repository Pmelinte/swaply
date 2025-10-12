'use client';

import { useState } from 'react';
import Link from 'next/link';
import MatchingRouteMap from '@/components/MatchingRouteMap';

interface MatchObject {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  condition: string;
  images: string[];
  score: number;
  reasons: string[];
  user: {
    name: string;
    avatar: string;
  };
}

// Date mock pentru demonstrație
const MOCK_MATCHES: MatchObject[] = [
  {
    id: '1',
    name: 'iPhone 14 Pro Max',
    category: 'Electronice',
    description: 'iPhone 14 Pro Max în stare perfectă, cu toate accesoriile incluse.',
    location: 'București',
    condition: 'like-new',
    images: ['https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'],
    score: 95,
    reasons: ['📱 Categorie identică', '📍 Locație apropiată', '💰 Valoare similară'],
    user: { name: 'Alexandru M.', avatar: 'AM' }
  },
  {
    id: '2',
    name: 'MacBook Pro M2',
    category: 'Electronice',
    description: 'MacBook Pro cu procesor M2, perfect pentru programare și design.',
    location: 'Cluj-Napoca',
    condition: 'good',
    images: ['https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'],
    score: 88,
    reasons: ['📱 Categorii compatibile', '🔍 Cuvinte cheie relevante'],
    user: { name: 'Maria S.', avatar: 'MS' }
  },
  {
    id: '3',
    name: 'PlayStation 5',
    category: 'Gaming',
    description: 'PS5 cu controller extra și jocuri incluse.',
    location: 'Timișoara',
    condition: 'good',
    images: ['https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400'],
    score: 82,
    reasons: ['📦 Categorii compatibile', '✨ Stări compatibile'],
    user: { name: 'Andrei P.', avatar: 'AP' }
  },
  {
    id: '4',
    name: 'Samsung Galaxy S23',
    category: 'Electronice',
    description: 'Samsung Galaxy S23 în garanție, cu husă și folie protectoare.',
    location: 'București',
    condition: 'new',
    images: ['https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400'],
    score: 78,
    reasons: ['📱 Categorie identică', '📍 Locație apropiată'],
    user: { name: 'Diana L.', avatar: 'DL' }
  },
  {
    id: '5',
    name: 'iPad Air',
    category: 'Electronice',
    description: 'iPad Air cu Apple Pencil și keyboard case.',
    location: 'Iași',
    condition: 'like-new',
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'],
    score: 72,
    reasons: ['📱 Categorii compatibile', '💰 Valoare similară'],
    user: { name: 'Bogdan R.', avatar: 'BR' }
  }
];

const CONDITION_LABELS: Record<string, string> = {
  'new': '🆕 Nou',
  'like-new': '✨ Ca nou',
  'good': '👍 Bună',
  'fair': '👌 Acceptabilă',
  'poor': '🔧 Necesită reparații'
};

export default function MatchPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [minScore, setMinScore] = useState<number>(50);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');
  const [selectedMatchForMap, setSelectedMatchForMap] = useState<MatchObject | null>(null);

  const filteredMatches = MOCK_MATCHES.filter(match => {
    const categoryMatch = selectedCategory === 'all' || match.category === selectedCategory;
    const scoreMatch = match.score >= minScore;
    return categoryMatch && scoreMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 Match-uri pentru tine
          </h1>
          <p className="text-gray-600">
            Obiecte compatibile găsite în baza algoritmului nostru inteligent
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center space-x-2 ${
                activeTab === 'list'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>📋</span>
              <span>Listă Match-uri</span>
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors flex items-center justify-center space-x-2 ${
                activeTab === 'map'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>🗺️</span>
              <span>Hartă Rute</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        {activeTab === 'list' && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrează după categorie
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Toate categoriile</option>
                  <option value="Electronice">💻 Electronice</option>
                  <option value="Gaming">🎮 Gaming</option>
                  <option value="Carti">📚 Cărți</option>
                  <option value="Casa">🏠 Casă</option>
                  <option value="Sport">⚽ Sport</option>
                  <option value="Generale">📦 Generale</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scor minim compatibilitate: {minScore}%
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>30%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {activeTab === 'list' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMatches.map((match) => (
            <div key={match.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              {/* Score Badge */}
              <div className="relative">
                <div className="absolute top-3 right-3 z-10">
                  <div className={`px-3 py-1 rounded-full text-sm font-bold text-white ${
                    match.score >= 90 ? 'bg-green-500' :
                    match.score >= 75 ? 'bg-blue-500' :
                    match.score >= 60 ? 'bg-yellow-500' : 'bg-gray-500'
                  }`}>
                    {match.score}%
                  </div>
                </div>
                
                {/* Image */}
                <div className="h-48 bg-gray-200 overflow-hidden">
                  <img
                    src={match.images[0]}
                    alt={match.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <div className="p-6">
                {/* Object Info */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {match.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {match.description.substring(0, 80)}...
                  </p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      {match.category}
                    </span>
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {CONDITION_LABELS[match.condition]}
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                      📍 {match.location}
                    </span>
                  </div>
                </div>

                {/* Match Reasons */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    De ce este un match bun:
                  </h4>
                  <div className="space-y-1">
                    {match.reasons.map((reason, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-center">
                        <span className="mr-1">•</span>
                        {reason}
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Info */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {match.user.avatar}
                    </div>
                    <span className="ml-2 text-sm text-gray-700">
                      {match.user.name}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs hover:bg-blue-200 transition-colors">
                      💬 Mesaj
                    </button>
                    <button className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs hover:bg-green-200 transition-colors">
                      🤝 Propune Schimb
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}

        {/* Map View */}
        {activeTab === 'map' && (
          <div className="space-y-6">
            {/* Match Selector */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Selectează un match pentru a vedea ruta:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredMatches.map((match) => (
                  <button
                    key={match.id}
                    onClick={() => setSelectedMatchForMap(match)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedMatchForMap?.id === match.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-900 text-sm truncate">
                        {match.name}
                      </span>
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                        {match.score}%
                      </span>
                    </div>
                    <div className="flex items-center text-xs text-gray-600 space-x-2">
                      <span>📍 {match.location}</span>
                      <span>•</span>
                      <span>{match.user.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Route Map */}
            {selectedMatchForMap ? (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <MatchingRouteMap
                  user1={{
                    id: 'current-user',
                    name: 'Tu',
                    lat: 44.4268, // București - default pentru user curent
                    lng: 26.1025,
                    category: 'it',
                    itemName: 'Obiectul tău',
                  }}
                  user2={{
                    id: selectedMatchForMap.id,
                    name: selectedMatchForMap.user.name,
                    lat: selectedMatchForMap.location === 'București' ? 44.4268 :
                         selectedMatchForMap.location === 'Cluj-Napoca' ? 46.7712 :
                         selectedMatchForMap.location === 'Timișoara' ? 45.7489 :
                         selectedMatchForMap.location === 'Iași' ? 47.1585 : 44.4268,
                    lng: selectedMatchForMap.location === 'București' ? 26.1025 :
                         selectedMatchForMap.location === 'Cluj-Napoca' ? 23.6236 :
                         selectedMatchForMap.location === 'Timișoara' ? 21.2087 :
                         selectedMatchForMap.location === 'Iași' ? 27.6014 : 26.1025,
                    category: selectedMatchForMap.category.toLowerCase(),
                    itemName: selectedMatchForMap.name,
                  }}
                  showAlternativeRoutes={true}
                  travelMode="DRIVING"
                  className="w-full h-[600px] rounded-lg"
                />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Selectează un match
                </h3>
                <p className="text-gray-500">
                  Alege un obiect din lista de mai sus pentru a vedea ruta optimă
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State - only for list view */}
        {activeTab === 'list' && filteredMatches.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤔</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nu am găsit match-uri
            </h3>
            <p className="text-gray-500 mb-6">
              Încearcă să relaxezi filtrele sau adaugă mai multe obiecte
            </p>
            <Link
              href="/obiecte/nou"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ➕ Adaugă un obiect nou
            </Link>
          </div>
        )}

        {/* Action Bar */}
        <div className="fixed bottom-20 left-4 right-4 md:relative md:bottom-0 md:left-0 md:right-0 md:mt-8">
          <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <h3 className="font-semibold text-gray-900">
                  Găsit {filteredMatches.length} match-uri compatibile
                </h3>
                <p className="text-sm text-gray-600">
                  Algoritmul nostru IA a analizat {MOCK_MATCHES.length} obiecte disponibile
                </p>
              </div>
              
              <div className="flex gap-3">
                <Link
                  href="/obiecte/nou"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  ➕ Adaugă obiect
                </Link>
                <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
                  🎯 Recomandări AI
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}