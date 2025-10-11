'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/context';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('toate');

  // Determine if user is logged in
  const isLoggedIn = !!user && !loading;
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || "Utilizator";

  // Categories for map filtering
  const categories = [
    { id: 'toate', name: 'Toate', icon: '🌍' },
    { id: 'sport', name: 'Sport', icon: '⚽' },
    { id: 'arta', name: 'Artă', icon: '🎨' },
    { id: 'it', name: 'IT', icon: '💻' },
    { id: 'muzica', name: 'Muzică', icon: '🎵' },
    { id: 'casa', name: 'Casă', icon: '🏠' }
  ];

  // Mock data pentru harta utilizatorilor activi
  const activeUsers = [
    { id: 1, lat: 44.4268, lng: 26.1025, category: 'it', name: 'Alex - MacBook Pro' },
    { id: 2, lat: 46.7712, lng: 23.6236, category: 'sport', name: 'Maria - Bicicletă' },
    { id: 3, lat: 45.7489, lng: 21.2087, category: 'muzica', name: 'Andrei - Chitară' },
    { id: 4, lat: 47.1585, lng: 27.6014, category: 'arta', name: 'Ana - Set pictură' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      {/* Header Section */}
      <div className="relative bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {isLoggedIn ? (
            // Header pentru utilizatori logați
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Bine ai revenit, {userName}! 👋
              </h1>
              <p className="text-gray-600 mb-6">
                Gata să faci noi schimburi inteligente?
              </p>
              
              {/* Butoane rapide pentru utilizatori logați */}
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/obiecte/nou"
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <span>📦</span>
                  <span>Adaugă obiect</span>
                </Link>
                <Link
                  href="/match"
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <span>🎯</span>
                  <span>Găsește potriviri</span>
                </Link>
                <Link
                  href="/cereri"
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium flex items-center space-x-2"
                >
                  <span>📋</span>
                  <span>Vezi cereri</span>
                </Link>
              </div>
            </div>
          ) : (
            // Header pentru vizitatori
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Schimbă, nu cumpăra
              </h1>
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Comunitate globală de schimburi inteligente. Redescoperă valoarea obiectelor tale și găsește exact ce îți trebuie prin schimb.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/login"
                  className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  🔑 Autentifică-te
                </Link>
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 text-white text-lg font-semibold rounded-xl hover:from-green-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  🚀 Creează cont gratuit
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Category Filter */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isLoggedIn ? '🗺️ Obiecte disponibile aproape de tine' : '👥 Filtrează utilizatori activi după categorie'}
          </h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-96 bg-gray-100 flex items-center justify-center">
            <p className="text-gray-500">🗺️ Harta se va încărca aici</p>
          </div>
          
          {/* Map info panel */}
          <div className="p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {isLoggedIn 
                    ? `🗺️ Obiecte în zona ta` 
                    : `👥 Utilizatori activi: ${categories.find(c => c.id === selectedCategory)?.name}`
                  }
                </h3>
                <p className="text-gray-600">
                  {activeUsers.filter(u => selectedCategory === 'toate' || u.category === selectedCategory).length} rezultate găsite
                </p>
              </div>
              <div className="text-2xl">
                {categories.find(c => c.id === selectedCategory)?.icon}
              </div>
            </div>
            
            {/* Quick user list */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeUsers
                .filter(user => selectedCategory === 'toate' || user.category === selectedCategory)
                .slice(0, 4)
                .map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-3 bg-white rounded-lg border hover:border-blue-300 transition-colors cursor-pointer"
                  >
                    <div className="text-2xl">
                      {categories.find(c => c.id === user.category)?.icon}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">În apropiere</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Demo/Testing Info pentru dezvoltare */}
        {!loading && (
          <div className="mt-8 text-center">
            <div className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">
              🔄 Status: {isLoggedIn ? `Logat ca ${userName}` : 'Vizitator'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}