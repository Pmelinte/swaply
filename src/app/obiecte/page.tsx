import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Obiectele Mele - Swaply',
  description: 'Gestionează obiectele tale și descoperă propuneri AI',
};

export default function ObjectsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            📦 Obiectele Mele
          </h1>
          <p className="text-xl text-gray-600">
            Gestionează-ți obiectele și descoperă sugestii inteligente
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">📱</div>
            <div className="text-2xl font-bold text-blue-600">12</div>
            <div className="text-gray-600">Obiecte Active</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">🔄</div>
            <div className="text-2xl font-bold text-green-600">5</div>
            <div className="text-gray-600">Schimburi în Curs</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">✨</div>
            <div className="text-2xl font-bold text-purple-600">8</div>
            <div className="text-gray-600">Match-uri Noi</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-2xl font-bold text-orange-600">95%</div>
            <div className="text-gray-600">Rating Satisfacție</div>
          </div>
        </div>

        {/* Main Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="text-5xl mb-4">➕</div>
              <h3 className="text-xl font-semibold mb-3">Adaugă Obiect Nou</h3>
              <p className="text-gray-600 mb-6">
                Publică un obiect pe care vrei să-l schimbi și primește propuneri
              </p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors w-full">
                Începe Acum
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="text-5xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold mb-3">Vezi Match-uri AI</h3>
              <p className="text-gray-600 mb-6">
                Descoperă obiectele perfecte pentru tine cu ajutorul AI-ului
              </p>
              <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors w-full">
                Explorează
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <div className="text-5xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-3">Mesaje Active</h3>
              <p className="text-gray-600 mb-6">
                Continuă conversațiile cu utilizatorii interesați
              </p>
              <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors w-full">
                Vezi Mesaje
              </button>
            </div>
          </div>
        </div>

        {/* AI Suggestions Section */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white p-8 mb-12">
          <div className="text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h2 className="text-2xl font-bold mb-3">Sugestii AI Personalizate</h2>
            <p className="text-purple-100 mb-6">
              AI-ul nostru a analizat preferințele tale și a găsit acestea pentru tine:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-6">
                <h3 className="font-semibold mb-2">📱 Tech Exchange</h3>
                <p className="text-sm text-purple-100">
                  Cineva din București oferă un iPad Pro pentru iPhone-ul tău
                </p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-6">
                <h3 className="font-semibold mb-2">🎮 Gaming Setup</h3>
                <p className="text-sm text-purple-100">
                  Match perfect pentru consolele tale în Cluj-Napoca
                </p>
              </div>
            </div>

            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg hover:bg-purple-50 transition-colors mt-6 font-semibold">
              Vezi Toate Sugestiile AI
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 Activitate Recentă</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">✓</span>
                </div>
                <div>
                  <h3 className="font-semibold">Schimb Finalizat</h3>
                  <p className="text-gray-600 text-sm">iPhone 13 ↔ MacBook Air</p>
                </div>
              </div>
              <span className="text-gray-500 text-sm">2 ore</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">💬</span>
                </div>
                <div>
                  <h3 className="font-semibold">Mesaj Nou</h3>
                  <p className="text-gray-600 text-sm">Maria este interesată de camera ta</p>
                </div>
              </div>
              <span className="text-gray-500 text-sm">5 ore</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">🎯</span>
                </div>
                <div>
                  <h3 className="font-semibold">Match Nou</h3>
                  <p className="text-gray-600 text-sm">PS5 găsit pentru Nintendo Switch-ul tău</p>
                </div>
              </div>
              <span className="text-gray-500 text-sm">1 zi</span>
            </div>
          </div>

          <button className="w-full mt-6 text-blue-600 hover:text-blue-700 font-semibold">
            Vezi Toată Activitatea →
          </button>
        </div>
      </div>
    </div>
  );
}