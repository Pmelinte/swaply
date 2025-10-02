import { addObject } from './actions';

export default function AddObjectPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
            📦 Adaugă un obiect pentru schimb
          </h1>

          <form className="space-y-6">
            {/* Object Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Numele obiectului *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                placeholder="ex: MacBook Pro 2020, Canon EOS 90D..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Category Selection */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
              </label>
              <select
                id="category"
                name="category"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Alege categoria...</option>
                <option value="tech">💻 Tech & Gadget-uri</option>
                <option value="books">📚 Cărți & Reviste</option>
                <option value="jewelry">💍 Bijuterii & Accesorii</option>
                <option value="tools">🔧 Unelte & DIY</option>
                <option value="gaming">🎮 Gaming & Console</option>
                <option value="home">🏠 Casă & Grădină</option>
                <option value="sports">⚽ Sport & Fitness</option>
                <option value="music">🎵 Muzică & Instrumente</option>
                <option value="art">🎨 Artă & Crafturi</option>
                <option value="fashion">👗 Fashion & Haine</option>
                <option value="kids">🧸 Copii & Jucării</option>
                <option value="other">🔖 Altele</option>
              </select>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descrierea obiectului *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                placeholder="Descrie obiectul: starea, vârsta, specificații, de ce vrei să îl schimbi..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              ></textarea>
            </div>

            {/* Condition */}
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                Starea obiectului *
              </label>
              <select
                id="condition"
                name="condition"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Alege starea...</option>
                <option value="new">🆕 Nou / Nefolosit</option>
                <option value="excellent">✨ Excelent (ca nou)</option>
                <option value="very-good">👍 Foarte bună</option>
                <option value="good">👌 Bună</option>
                <option value="fair">⚠️ Acceptabilă</option>
              </select>
            </div>

            {/* Estimated Value */}
            <div>
              <label htmlFor="estimated_value" className="block text-sm font-medium text-gray-700 mb-2">
                Valoare estimată (RON)
              </label>
              <input
                type="number"
                id="estimated_value"
                name="estimated_value"
                min="0"
                step="0.01"
                placeholder="ex: 2500.00"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* What I Want in Exchange */}
            <div>
              <label htmlFor="desired_items" className="block text-sm font-medium text-gray-700 mb-2">
                Ce vreau în schimb *
              </label>
              <textarea
                id="desired_items"
                name="desired_items"
                required
                rows={3}
                placeholder="ex: Gaming laptop, iPhone nou, bicicleta MTB, aparate foto..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              ></textarea>
            </div>

            {/* Exchange Preferences */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferințe schimb *
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="exchange_local"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">🏠 Schimb local (în aceeași localitate)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="exchange_courier"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">📦 Schimb prin curier (în toată țara)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="exchange_travel"
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">✈️ Schimb cu vacanță (călătoresc pentru schimb)</span>
                </label>
              </div>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Locația ta *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                required
                placeholder="ex: București, Sector 1"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Image Upload */}
            <div>
              <label htmlFor="images" className="block text-sm font-medium text-gray-700 mb-2">
                Fotografii obiect (max 6) *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  id="images"
                  name="images"
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <label htmlFor="images" className="cursor-pointer">
                  <div className="space-y-2">
                    <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">
                        Apasă pentru a încărca fotografii
                      </span>
                      <span> sau trage și lasă aici</span>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, WEBP până la 10MB fiecare</p>
                  </div>
                </label>
              </div>
              
              {/* Image Preview Area */}
              <div id="image-preview" className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 hidden">
                {/* JavaScript will populate this */}
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Anulează
              </button>
              <button
                type="submit"
                formAction={addObject}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                📦 Publică obiectul
              </button>
            </div>
          </form>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">💡 Sfaturi pentru un schimb reușit:</h3>
          <ul className="space-y-2 text-sm text-blue-700">
            <li>• Adaugă fotografii clare din mai multe unghiuri</li>
            <li>• Descrie honest starea și orice defecte</li>
            <li>• Menționează ambalajul original, garanția, accesoriile</li>
            <li>• Specifică de ce vrei să îl schimbi</li>
            <li>• Fii deschis la negociere și alternative</li>
          </ul>
        </div>
      </div>
    </div>
  );
}