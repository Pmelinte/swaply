'use client';

import { useState, useEffect } from 'react';
import { generateTravelSuggestions, type TravelSuggestion } from '@/lib/travel/suggestions';
import { useI18n } from '@/lib/i18n';

interface TravelSuggestionsProps {
  location1: string;
  location2: string;
  onSuggestionSelect?: (suggestion: TravelSuggestion) => void;
}

export default function TravelSuggestions({ 
  location1, 
  location2, 
  onSuggestionSelect 
}: TravelSuggestionsProps) {
  const { t } = useI18n();
  const [suggestions, setSuggestions] = useState<TravelSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<TravelSuggestion | null>(null);
  const [preferences, setPreferences] = useState({
    budget_range: 'medium' as 'low' | 'medium' | 'high',
    duration_days: 2,
    travel_style: 'cultural' as 'adventure' | 'relaxed' | 'cultural' | 'romantic'
  });

  useEffect(() => {
    loadSuggestions();
  }, [location1, location2, preferences]);

  const loadSuggestions = async () => {
    if (!location1 || !location2) return;
    
    setLoading(true);
    try {
      const results = await generateTravelSuggestions(location1, location2, preferences);
      setSuggestions(results);
    } catch (error) {
      console.error('Error loading travel suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (min: number, max: number, currency: string) => {
    return `${min} - ${max} ${currency}`;
  };

  const getTransportIcon = (type: string) => {
    switch (type) {
      case 'car': return '🚗';
      case 'train': return '🚂';
      case 'bus': return '🚌';
      case 'plane': return '✈️';
      default: return '🚗';
    }
  };

  const getBudgetColor = (range: string) => {
    switch (range) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Generez sugestii de călătorie...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Preferences */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎯 Preferințe călătorie
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buget
            </label>
            <select
              value={preferences.budget_range}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                budget_range: e.target.value as any 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Economic (sub 400 RON)</option>
              <option value="medium">Mediu (400-800 RON)</option>
              <option value="high">Premium (peste 800 RON)</option>
            </select>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Durată (zile)
            </label>
            <select
              value={preferences.duration_days}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                duration_days: parseInt(e.target.value) 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1 zi</option>
              <option value={2}>2 zile</option>
              <option value={3}>3 zile</option>
              <option value={5}>5 zile</option>
              <option value={7}>O săptămână</option>
            </select>
          </div>

          {/* Travel Style */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stil călătorie
            </label>
            <select
              value={preferences.travel_style}
              onChange={(e) => setPreferences(prev => ({ 
                ...prev, 
                travel_style: e.target.value as any 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="cultural">Cultural</option>
              <option value="adventure">Aventură</option>
              <option value="relaxed">Relaxant</option>
              <option value="romantic">Romantic</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div 
            key={index}
            className={`bg-white rounded-xl border-2 transition-colors cursor-pointer ${
              selectedSuggestion === suggestion 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => {
              setSelectedSuggestion(suggestion);
              onSuggestionSelect?.(suggestion);
            }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    📍 {suggestion.destination.city}
                  </h3>
                  <p className="text-gray-600">
                    📏 {suggestion.distance_km} km • ⏱️ {Math.round(suggestion.travel_time_hours * 10) / 10}h transport
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatPrice(
                      suggestion.cost_estimate.total.min,
                      suggestion.cost_estimate.total.max,
                      suggestion.cost_estimate.currency
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {suggestion.cost_estimate.duration_days} {suggestion.cost_estimate.duration_days === 1 ? 'zi' : 'zile'}
                  </div>
                </div>
              </div>

              {/* Transport Options */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">🚗 Transport</h4>
                <div className="flex flex-wrap gap-2">
                  {suggestion.transport_options.slice(0, 3).map((transport, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center space-x-2 bg-gray-100 px-3 py-1 rounded-full text-sm"
                    >
                      <span>{getTransportIcon(transport.type)}</span>
                      <span className="capitalize">{transport.type}</span>
                      <span className="text-gray-600">
                        {formatPrice(transport.price_range.min, transport.price_range.max, transport.price_range.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attractions */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">🎯 Atracții principale</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {suggestion.attractions.slice(0, 4).map((attraction, idx) => (
                    <div key={idx} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div>
                        <div className="font-medium text-gray-900">{attraction.name}</div>
                        <div className="text-sm text-gray-600">{attraction.description}</div>
                        <div className="text-xs text-gray-500 flex items-center space-x-2">
                          <span>⭐ {attraction.rating}</span>
                          <span>⏱️ {attraction.estimated_visit_time}</span>
                          {attraction.entry_fee && (
                            <span>💰 {attraction.entry_fee.amount} {attraction.entry_fee.currency}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activities */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">🎪 Activități recomandate</h4>
                <div className="flex flex-wrap gap-2">
                  {suggestion.activities.map((activity, idx) => (
                    <div 
                      key={idx}
                      className="bg-gradient-to-r from-blue-100 to-purple-100 px-3 py-1 rounded-lg text-sm"
                    >
                      <span className="font-medium">{activity.name}</span>
                      <span className="text-gray-600 ml-2">({activity.duration})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accommodation */}
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">🏨 Cazare</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {suggestion.accommodations.map((accommodation, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{accommodation.name}</span>
                        <span className="text-xs text-gray-600">⭐ {accommodation.rating}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1 capitalize">
                        {accommodation.type}
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        {formatPrice(
                          accommodation.price_per_night.min,
                          accommodation.price_per_night.max,
                          accommodation.price_per_night.currency
                        )}/noapte
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather & Best Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">🌤️ Vremea</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Sezon: {suggestion.weather_info.current_season}</div>
                    <div>
                      Temperatură: {suggestion.weather_info.temperature_range.min}°C - {suggestion.weather_info.temperature_range.max}°C
                    </div>
                    <div>Ce să iei: {suggestion.weather_info.what_to_pack.join(', ')}</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📅 Perioada ideală</h4>
                  <div className="text-sm text-gray-600">
                    {suggestion.best_time_to_visit}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Luni recomandate: {suggestion.weather_info.best_months.join(', ')}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedSuggestion === suggestion && (
                <div className="mt-6 flex space-x-3">
                  <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    📋 Vezi detalii complete
                  </button>
                  <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                    ✅ Selectează destinația
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    📤 Trimite sugestia
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {suggestions.length === 0 && !loading && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-8 text-center">
          <div className="text-gray-400 text-6xl mb-4">🗺️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nu s-au găsit sugestii
          </h3>
          <p className="text-gray-600">
            Încearcă să modifici preferințele sau verifică dacă locațiile sunt corecte.
          </p>
        </div>
      )}
    </div>
  );
}