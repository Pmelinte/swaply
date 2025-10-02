'use client';

import Link from 'next/link';

// VERCEL FORCE DEPLOY: This should NEVER show "Welcome to Swaply" - DASHBOARD ONLY
export default function HomePage() {
  // Force Vercel to rebuild - timestamp marker
  const buildTimestamp = '2025-10-02-FORCE-DASHBOARD';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* VERCEL DEBUG: If you see this, the build worked */}
      <div className="hidden">{buildTimestamp}</div>
      
      {/* Header - Mobile Optimized */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                🔄 Swaply - Platformă Schimb Obiecte ✨ [VERCEL BUILD SUCCESS]
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">
                Schimbă obiecte cu alți utilizatori și descoperă destinații noi! ✨
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Link
                href="/login"
                className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-center"
              >
                Conectează-te
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
              >
                Înregistrează-te
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Features Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          {/* Add Object */}
          <Link href="/obiecte/nou">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-shadow cursor-pointer transform hover:scale-105">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📦</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Adaugă Obiect Nou
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Publică un obiect pe care vrei să-l schimbi cu altceva util.
              </p>
              <div className="text-blue-600 font-medium text-sm sm:text-base">
                Începe acum →
              </div>
            </div>
          </Link>

          {/* View Requests */}
          <Link href="/cereri">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-shadow cursor-pointer transform hover:scale-105">
              <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📋</div>
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                Cererile Mele
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Gestionează cererile de schimb primite și trimise.
              </p>
              <div className="text-blue-600 font-medium text-sm sm:text-base">
                Vezi cereri →
              </div>
            </div>
          </Link>

          {/* Chat */}
          <Link href="/chat/demo">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow cursor-pointer">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Chat Real-time
              </h3>
              <p className="text-gray-600 mb-4">
                Comunică instant cu alți utilizatori pentru schimburi.
              </p>
              <div className="text-blue-600 font-medium">
                Demo chat →
              </div>
            </div>
          </Link>

          {/* Travel Suggestions Demo */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-4xl mb-4">✈️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Sugestii Călătorie
            </h3>
            <p className="text-gray-600 mb-4">
              Descoperă destinații pentru schimburi la distanță.
            </p>
            <button 
              onClick={() => {
                // Demo functionality - will be shown in modal
                alert('Demo: Vezi componenta TravelSuggestions în acțiune când faci o cerere de schimb cu călătorie!');
              }}
              className="text-blue-600 font-medium hover:text-blue-700"
            >
              Vezi demo →
            </button>
          </div>

          {/* Matching Algorithm Demo */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Matching Inteligent
            </h3>
            <p className="text-gray-600 mb-4">
              Algoritm care găsește cele mai bune potriviri pentru tine.
            </p>
            <button 
              onClick={() => {
                alert('Demo: Algoritmul analizează ce ai + ce vrei și găsește potriviri perfecte cu scoring 0-100%!');
              }}
              className="text-blue-600 font-medium hover:text-blue-700"
            >
              Vezi algoritm →
            </button>
          </div>

          {/* Database Schema */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="text-4xl mb-4">🗄️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Baza de Date
            </h3>
            <p className="text-gray-600 mb-4">
              Schema completă cu 8 tabele și relații complexe.
            </p>
            <button 
              onClick={() => {
                alert('Database: objects, user_profiles, swap_requests, messages, ratings, notifications, travel_suggestions, categories + RLS policies!');
              }}
              className="text-blue-600 font-medium hover:text-blue-700"
            >
              Vezi schema →
            </button>
          </div>
        </div>

        {/* Implementation Status */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            📊 Status Implementare
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Completed Features */}
            <div>
              <h3 className="text-lg font-semibold text-green-600 mb-4 flex items-center">
                <span className="mr-2">✅</span>
                Funcționalități Complete
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>TypeScript + Next.js 15 setup complet</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Formular adăugare obiecte cu validare</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Schema baza de date cu 8 tabele</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Algoritm matching cu scoring inteligent</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Chat real-time cu Supabase</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Travel Suggestions API complet</span>
                </li>
              </ul>
            </div>

            {/* Pending Features */}
            <div>
              <h3 className="text-lg font-semibold text-yellow-600 mb-4 flex items-center">
                <span className="mr-2">🔄</span>
                În Dezvoltare
              </h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Sistem notificări push</span>
                </li>
                <li className="flex items-center space-x-3">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  <span>Optimizare completă mobile</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions - Mobile Optimized */}
        <div className="mt-8 sm:mt-12 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
            🚀 Acțiuni Rapide
          </h2>
          <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-3 sm:gap-4">
            <Link
              href="/obiecte/nou"
              className="px-4 sm:px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base"
            >
              📦 Adaugă primul obiect
            </Link>
            <Link
              href="/signup"
              className="px-4 sm:px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
            >
              👤 Creează cont
            </Link>
            <Link
              href="/cereri"
              className="px-4 sm:px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm sm:text-base"
            >
              📋 Vezi toate cererile
            </Link>
          </div>
        </div>

        {/* Development Info - Mobile Optimized */}
        <div className="mt-8 sm:mt-12 bg-gray-100 rounded-xl p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
            🛠️ Informații Dezvoltare
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
            <div>
              <div className="font-medium text-gray-900">Frontend:</div>
              <div>Next.js 15, TypeScript, TailwindCSS</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Backend:</div>
              <div>Supabase, PostgreSQL, Realtime</div>
            </div>
            <div>
              <div className="font-medium text-gray-900">Features:</div>
              <div>Auth, Chat, Travel API, Matching</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}