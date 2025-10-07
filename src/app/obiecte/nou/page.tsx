'use client';

import { useState } from 'react';
import { addObject } from './actions';
import { huggingFaceAI } from '@/lib/ai/huggingface';

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
    description: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setAiAnalysis({ isAnalyzing: true });

    try {
      const file = files[0];
      const imageUrl = URL.createObjectURL(file);
      setImages([imageUrl]);

      if (useAiSuggestions) {
        // Real AI classification with HuggingFace
        const classification = await huggingFaceAI.classifyObjectFromImage(file);
        const pricing = await huggingFaceAI.estimatePrice(
          classification.category, 
          classification.suggestedTitle || ''
        );
        
        const analysis = {
          category: classification.category,
          suggestedTitle: classification.suggestedTitle,
          description: classification.description,
          estimatedPrice: pricing.estimatedPrice,
          confidence: classification.confidence,
          isAnalyzing: false
        };
        
        setAiAnalysis(analysis);
        setFormData(prev => ({
          ...prev,
          name: analysis.suggestedTitle || prev.name,
          category: analysis.category || prev.category,
          description: analysis.description || prev.description
        }));
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      setAiAnalysis({ isAnalyzing: false });
    }
  };

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

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Imagini obiect * {useAiSuggestions && '(AI analizează prima imagine)'}
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="images"
                />
                <label htmlFor="images" className="cursor-pointer">
                  {images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-4">
                      {images.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📷</div>
                      <div className="text-gray-600">
                        Încarcă imagini pentru analiză AI automată
                      </div>
                    </div>
                  )}
                </label>
              </div>
              {aiAnalysis.isAnalyzing && (
                <div className="mt-2 flex items-center text-blue-600">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                  AI analizează imaginea...
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

            <button
              type="submit"
              formAction={addObject}
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
