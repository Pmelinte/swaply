import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Obiectele Mele - Swaply',
  description: 'Gestionează obiectele tale și descoperă propuneri AI',
};

export default function ObjectsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🎒 Obiectele Mele
          </h1>
          <p className="text-gray-600">
            Gestionează obiectele tale și primește propuneri AI personalizate
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick Add Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">✨ Adaugă Obiect Nou</h2>
              <p className="opacity-90">AI-ul îți completează automat titlul, categoria și prețul</p>
            </div>
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              + Adaugă
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
          <button className="flex-1 py-2 px-4 bg-white rounded-md shadow-sm font-medium text-blue-600">
            Obiectele Mele (5)
          </button>
          <button className="flex-1 py-2 px-4 text-gray-600 hover:text-gray-900">
            Wishlist (3)
          </button>
          <button className="flex-1 py-2 px-4 text-gray-600 hover:text-gray-900">
            Propuneri AI
          </button>
        </div>

        {/* My Objects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
              {/* Image */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                <span className="text-4xl text-white">📱</span>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">iPhone 13 Pro Max</h3>
                  <div className="flex items-center space-x-1">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">🤖 AI</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-2">Smartphone premium în stare excelentă</p>
                
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Electronice</span>
                  <span className="font-semibold text-green-600">~4.500 RON</span>
                </div>
                
                {/* Matching Score */}
                <div className="bg-gray-50 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Scor Matching</span>
                    <span className="font-semibold text-purple-600">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div className="bg-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
                
                {/* Exchange Method */}
                <div className="flex space-x-2 text-xs">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full">🚶 Local</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">📦 Curier</span>
                </div>
                
                {/* Actions */}
                <div className="flex space-x-2 mt-4">
                  <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">
                    Vezi Potriviri
                  </button>
                  <button className="px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50">
                    ⋯
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🧠</span>
            Insights AI
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">📈</div>
              <div className="font-semibold text-blue-600">Preț Mediu</div>
              <div className="text-sm text-gray-600">2.850 RON per obiect</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-semibold text-green-600">Interes Ridicat</div>
              <div className="text-sm text-gray-600">Categoria Electronice</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">⭐</div>
              <div className="font-semibold text-purple-600">Top Performer</div>
              <div className="text-sm text-gray-600">iPhone 13 Pro Max</div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start space-x-3">
              <span className="text-xl">💡</span>
              <div>
                <h3 className="font-medium text-yellow-800">Recomandare AI</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Obiectele din categoria "Electronice" au cel mai mare interes în zona ta. 
                  Consideră să adaugi mai multe gadget-uri pentru potriviri mai bune.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}