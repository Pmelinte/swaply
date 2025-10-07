'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

interface TravelSuggestion {
  destination: string;
  distance_km: number;
  estimated_cost: number;
  description: string;
  activities: string[];
  duration_days: number;
}

interface TravelSuggestionsProps {
  location1: string;
  location2: string;
  onSuggestionSelect?: (suggestion: TravelSuggestion) => void;
}

export default function TravelSuggestions({ location1, location2, onSuggestionSelect }: TravelSuggestionsProps) {
  const { t } = useI18n();
  const [suggestions] = useState<TravelSuggestion[]>([
    {
      destination: 'Brașov',
      distance_km: 150,
      estimated_cost: 400,
      description: 'Centrul istoric medieval și Tâmpa',
      activities: ['Vizită Centrul Vechi', 'Telecabina Tâmpa', 'Castelul Bran'],
      duration_days: 2
    },
    {
      destination: 'Cluj-Napoca',
      distance_km: 200,
      estimated_cost: 350,
      description: 'Capitala culturală a Transilvaniei',
      activities: ['Piața Unirii', 'Parcul Central', 'Muzeul de Artă'],
      duration_days: 2
    }
  ]);

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🏖️ Sugestii de călătorie
      </h3>
      <p className="text-gray-600 mb-6">
        Profitați de schimb pentru o mini-vacanță! Iată destinații perfecte între {location1} și {location2}.
      </p>

      <div className="space-y-4">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
               onClick={() => onSuggestionSelect?.(suggestion)}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium text-gray-900">{suggestion.destination}</h4>
              <span className="text-sm text-gray-500">{suggestion.distance_km} km</span>
            </div>
            <p className="text-gray-600 mb-3">{suggestion.description}</p>
            <div className="text-sm text-gray-500">
              <div>Activități: {suggestion.activities.join(', ')}</div>
              <div>Durată: {suggestion.duration_days} zile • Cost estimat: {suggestion.estimated_cost} RON</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}