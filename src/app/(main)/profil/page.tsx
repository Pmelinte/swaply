'use client';

import { useRequireAuth } from '@/lib/auth/context';
import Link from 'next/link';

export default function ProfilPage() {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Trebuie să fii autentificat
          </h1>
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Conectează-te
          </Link>
        </div>
      </div>
    );
  }

  const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Utilizator';
  const userLocation = user.user_metadata?.location || 'România';
  const joinedDate = new Date(user.created_at).toLocaleDateString('ro-RO');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {userName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                ✓
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{userName}</h1>
                <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  ⭐ Verified User
                </span>
              </div>
              
              <div className="flex flex-col gap-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <span>📧</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📍</span>
                  <span>{userLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📅</span>
                  <span>Membru din {joinedDate}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                ✏️ Editează profilul
              </button>
              <Link
                href="/obiecte/nou"
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                ➕ Adaugă obiect
              </Link>
              <form action="/logout" method="POST" className="w-full">
                <button 
                  type="submit"
                  className="w-full bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  🚪 Deconectează-te
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
            <div className="text-gray-600">Obiecte active</div>
            <div className="text-sm text-gray-500 mt-1">
              Adaugă primul tău obiect!
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">0</div>
            <div className="text-gray-600">Schimburi realizate</div>
            <div className="text-sm text-gray-500 mt-1">
              Începe să schimbi obiecte
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">★ 5.0</div>
            <div className="text-gray-600">Rating comunitate</div>
            <div className="text-sm text-gray-500 mt-1">
              Profil nou verificat
            </div>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/obiecte"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Obiectele mele</h3>
            <p className="text-gray-600">Gestionează obiectele tale disponibile pentru schimb</p>
          </Link>

          <Link
            href="/match"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Match-uri</h3>
            <p className="text-gray-600">Descoperă obiecte compatibile cu ale tale</p>
          </Link>

          <Link
            href="/chat"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">💬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Conversații</h3>
            <p className="text-gray-600">Comunică cu alți membri ai comunității</p>
          </Link>

          <Link
            href="/cereri"
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🔄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Cereri swap</h3>
            <p className="text-gray-600">Gestionează cererile de schimb primite și trimise</p>
          </Link>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group cursor-pointer">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚙️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Setări</h3>
            <p className="text-gray-600">Configurează preferințele și notificările</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow group cursor-pointer">
            <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Statistici</h3>
            <p className="text-gray-600">Vezi activitatea și performanțele tale</p>
          </div>
        </div>

        {/* Security Info */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mt-8">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🔒</div>
            <div>
              <h3 className="font-semibold text-green-800 mb-2">Contul tău este securizat</h3>
              <p className="text-green-700 text-sm">
                Profilul tău este verificat și securizat cu autentificare Supabase. 
                Datele tale sunt protejate și criptate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}