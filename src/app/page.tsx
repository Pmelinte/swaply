'use client';

import Link from 'next/link';
import { useState } from 'react';
import InteractiveMap from '@/components/InteractiveMap';
import { useSwipeGestures, useVisualFeedback } from '@/hooks/useGestures';
import { GestureHints, RippleEffect } from '@/components/GestureComponents';
import { useAuth } from '@/lib/auth/context';

export default function HomePage() {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('toate');

  // Determine if user is logged in
  const isLoggedIn = !!user && !loading;
  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || "Utilizator";

  // Initialize gesture hooks
  const { ripples, onTouchStart, onTouchEnd } = useVisualFeedback();
  const swipeHandlers = useSwipeGestures({
    onSwipeLeft: () => {
      // Navigate to next category
      const categoryIds = categories.map(cat => cat.id);
      const currentIndex = categoryIds.indexOf(selectedCategory);
      const nextIndex = (currentIndex + 1) % categoryIds.length;
      setSelectedCategory(categoryIds[nextIndex]);
    },
    onSwipeRight: () => {
      // Navigate to previous category
      const categoryIds = categories.map(cat => cat.id);
      const currentIndex = categoryIds.indexOf(selectedCategory);
      const prevIndex = currentIndex === 0 ? categoryIds.length - 1 : currentIndex - 1;
      setSelectedCategory(categoryIds[prevIndex]);
    },
    onSwipeUp: () => {
      // Show auth modal if not logged in
      if (!isLoggedIn) {
        setShowAuthModal(true);
      }
    },
    onSwipeDown: () => {
      // Close modals or navigate to browse
      setShowAuthModal(false);
    },
    threshold: 50
  });

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
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 relative"
      onTouchStart={(e) => {
        onTouchStart(e);
        swipeHandlers.onTouchStart(e);
      }}
      onTouchMove={swipeHandlers.onTouchMove}
      onTouchEnd={(e) => {
        onTouchEnd();
        swipeHandlers.onTouchEnd(e);
      }}
    >
      {/* Gesture feedback components */}
      <RippleEffect ripples={ripples} />
      <GestureHints 
        hints={[
          "👈 Swipe stânga/dreapta pentru a naviga prin categorii",
          "👆 Swipe sus pentru autentificare rapidă",
          "👇 Swipe jos pentru a închide modalurile"
        ]} 
        visible={true} 
      />
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
              
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-green-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg"
              >
                🚀 Autentifică-te sau Creează cont
              </button>
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
          <div className="h-96">
            <InteractiveMap />
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

      {/* Authentication Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            {authStep === 1 ? (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Alătură-te comunității Swaply! 🚀
                </h3>
                
                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder="Adresa de email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <div className="space-y-3">
                    <button className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Continuă cu Email
                    </button>
                    
                    <div className="text-center text-gray-500">sau</div>
                    
                    <button className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center justify-center space-x-2">
                      <span>🔴</span>
                      <span>Continuă cu Google</span>
                    </button>
                    
                    <button className="w-full px-4 py-3 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors font-medium flex items-center justify-center space-x-2">
                      <span>📘</span>
                      <span>Continuă cu Facebook</span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setShowAuthModal(false)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Anulează
                  </button>
                  <button
                    onClick={() => setAuthStep(2)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Continuă
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Ultimul pas! �
                </h3>
                
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Nume utilizator"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  
                  <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Selectează țara</option>
                    <option value="ro">🇷🇴 România</option>
                    <option value="md">🇲🇩 Moldova</option>
                    <option value="bg">🇧🇬 Bulgaria</option>
                    <option value="hu">🇭🇺 Ungaria</option>
                  </select>
                  
                  <label className="flex items-start space-x-3">
                    <input type="checkbox" className="mt-1" />
                    <span className="text-sm text-gray-600">
                      Accept <Link href="/termeni" className="text-blue-600 hover:text-blue-700">termenii și condițiile</Link> și <Link href="/confidentialitate" className="text-blue-600 hover:text-blue-700">politica de confidențialitate</Link>
                    </span>
                  </label>
                </div>
                
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => setAuthStep(1)}
                    className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Înapoi
                  </button>
                  <Link
                    href="/signup"
                    onClick={() => {
                      setShowAuthModal(false);
                      setAuthStep(1);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center"
                  >
                    Creează cont
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}