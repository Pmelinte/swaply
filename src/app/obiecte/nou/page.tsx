'use client';

import { useState } from 'react';
import { addObject } from './actions';
import { huggingFaceAI } from '@/lib/ai/huggingface';
import { estimatePrice } from '@/lib/ai/pricing';
import MultiImageUpload from '@/components/MultiImageUpload';
import SEOPreview from '@/components/SEOPreview';
import { useI18n } from '@/lib/i18n';

interface AIAnalysis {
  category?: string;
  suggestedTitle?: string;
  description?: string;
  estimatedPrice?: number;
  confidence?: number;
  isAnalyzing?: boolean;
}

export default function AddObjectPage() {
  const [images, setImages] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis>({});
  const [useAiSuggestions, setUseAiSuggestions] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    condition: 'good',
    location: '',
    desired_items: '',
    estimated_value: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ✨ Adaugă Obiect Nou cu AI
          </h1>
          <p className="text-gray-600">
            Inteligența artificială îți completează automat detaliile
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">

        <div className="bg-white rounded-xl shadow-lg p-6">
          <form className="space-y-6">
            {/* AI Toggle */}
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h3 className="font-medium text-blue-900">🤖 Asistent AI</h3>
                <p className="text-sm text-blue-700">Completare automată bazată pe imagini</p>
              </div>
              <button
                type="button"
                onClick={() => setUseAiSuggestions(!useAiSuggestions)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  useAiSuggestions ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  useAiSuggestions ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* Image Upload with Cloudinary - DRAG & DROP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📸 Imagini obiect * {useAiSuggestions && '(AI analizează prima imagine)'}
              </label>
              <MultiImageUpload
                maxImages={6}
                onImagesChange={async (imageUrls) => {
                  setImages(imageUrls);
                  
                  // Analyze first image with AI if enabled and we have images
                  if (useAiSuggestions && imageUrls.length > 0 && !aiAnalysis.isAnalyzing) {
                    setAiAnalysis({ isAnalyzing: true });
                    
                    try {
                      // Use AI pricing estimation based on form data
                      const pricing = await estimatePrice(
                        formData.name || 'Obiect pentru schimb',
                        formData.description || 'Obiect în stare bună pentru schimb',
                        formData.category || 'other',
                        formData.condition as any || 'good',
                        formData.location || 'Romania'
                      );
                      
                      setAiAnalysis({
                        estimatedPrice: pricing.estimatedPrice,
                        confidence: pricing.confidence,
                        isAnalyzing: false
                      });
                    } catch (error) {
                      console.error('AI analysis failed:', error);
                      setAiAnalysis({ isAnalyzing: false });
                    }
                  }
                }}
                existingImages={images}
              />
              {aiAnalysis.isAnalyzing && (
                <div className="mt-3 flex items-center text-blue-600 bg-blue-50 rounded-lg p-3">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full mr-3"></div>
                  <span className="font-medium">🤖 AI analizează imaginea și estimează prețul...</span>
                </div>
              )}
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Numele obiectului *
                {aiAnalysis.suggestedTitle && useAiSuggestions && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    🤖 Sugerat de AI
                  </span>
                )}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="ex: iPhone 13 Pro Max, MacBook Pro 2021..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Categoria *
                {aiAnalysis.category && useAiSuggestions && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    🤖 Detectată de AI ({Math.round((aiAnalysis.confidence || 0) * 100)}%)
                  </span>
                )}
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Alege categoria...</option>
                <option value="Electronice">💻 Electronice</option>
                <option value="Carti">📚 Cărți</option>
                <option value="Gaming">🎮 Gaming</option>
                <option value="Casa">🏠 Casă</option>
                <option value="Sport">⚽ Sport</option>
                <option value="Generale">📦 Generale</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Descriere
                {aiAnalysis.description && useAiSuggestions && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    🤖 Generată de AI
                  </span>
                )}
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Descrie obiectul..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Starea obiectului */}
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
                Starea obiectului *
              </label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={(e) => handleInputChange('condition', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="new">🆕 Nou</option>
                <option value="like-new">✨ Ca nou</option>
                <option value="good">👍 Bună</option>
                <option value="fair">👌 Acceptabilă</option>
                <option value="poor">🔧 Necesită reparații</option>
              </select>
            </div>

            {/* Locația */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Locația *
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="ex: București, Cluj-Napoca, Timișoara..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Ce doresc în schimb */}
            <div>
              <label htmlFor="desired_items" className="block text-sm font-medium text-gray-700 mb-2">
                Ce doresc în schimb *
              </label>
              <textarea
                id="desired_items"
                name="desired_items"
                rows={3}
                value={formData.desired_items}
                onChange={(e) => handleInputChange('desired_items', e.target.value)}
                placeholder="ex: Telefon Android, Cărți de programare, Consolă PS5..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Valoare estimată (opțional) */}
            <div>
              <label htmlFor="estimated_value" className="block text-sm font-medium text-gray-700 mb-2">
                Valoare estimată (RON)
                {aiAnalysis.estimatedPrice && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    🤖 AI: ~{aiAnalysis.estimatedPrice} RON
                  </span>
                )}
              </label>
              <input
                type="number"
                id="estimated_value"
                name="estimated_value"
                value={formData.estimated_value || ''}
                onChange={(e) => handleInputChange('estimated_value', e.target.value)}
                placeholder="ex: 500"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* SEO Preview */}
            <SEOPreview
              title={formData.name}
              description={formData.description}
              category={formData.category}
              value={formData.estimated_value ? parseFloat(formData.estimated_value) : undefined}
              condition={formData.condition}
            />

            {/* Preferințe schimb */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Modalități de schimb preferate
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="exchange_local"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">🤝 Întâlnire locală</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="exchange_courier"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">📦 Prin curier</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="exchange_travel"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">🚗 Deplasare reciprocă</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              formAction={async (formData) => {
                // Adaug imaginile în FormData
                formData.append('images', JSON.stringify(images));
                await addObject(formData);
              }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              🚀 Publică Obiectul cu AI
            </button>
          </form>
        </div>
      </div>

      {/* AI Insights Sidebar */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🧠</span>
            Analiză AI
          </h3>

          {aiAnalysis.isAnalyzing ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-600">Analizez imaginea...</p>
            </div>
          ) : aiAnalysis.estimatedPrice ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">💰 Estimare Preț</h4>
                <div className="text-2xl font-bold text-green-600">
                  ~{aiAnalysis.estimatedPrice} RON
                </div>
                <div className="text-sm text-green-700">
                  Încredere: {Math.round((aiAnalysis.confidence || 0) * 100)}%
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">🎯 Categorie Detectată</h4>
                <div className="text-lg font-semibold text-blue-600">
                  {aiAnalysis.category}
                </div>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-900 mb-2">💡 Sfaturi AI</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Adaugă mai multe imagini pentru analiză mai bună</li>
                  <li>• Menționează brandul pentru estimare precisă</li>
                  <li>• Specifică starea exactă a obiectului</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-4">🤖</div>
              <p>Încarcă o imagine pentru analiza AI</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
</div>
  );
}
