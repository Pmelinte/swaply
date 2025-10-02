'use client';

import { useState, useEffect } from 'react';
import { findMatches, MatchScore, SwapObject, getMatchExplanation } from '@/lib/matching/algorithm';

interface MatchResultsProps {
  userObject: SwapObject;
  availableObjects: SwapObject[];
}

export function MatchResults({ userObject, availableObjects }: MatchResultsProps) {
  const [matches, setMatches] = useState<MatchScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<MatchScore | null>(null);

  useEffect(() => {
    setLoading(true);
    
    // Simulate processing time for better UX
    const timer = setTimeout(() => {
      const matchResults = findMatches(userObject, availableObjects, {
        max_distance_km: 100,
        min_score_threshold: 0.2,
        max_results: 10,
        include_travel_swaps: true
      });
      
      setMatches(matchResults);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [userObject, availableObjects]);

  const getTargetObject = (matchScore: MatchScore): SwapObject | undefined => {
    return availableObjects.find(obj => obj.id === matchScore.object_id);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-blue-600 bg-blue-100';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 0.8) return 'Potrivire excelentă';
    if (score >= 0.6) return 'Potrivire bună';
    if (score >= 0.4) return 'Potrivire acceptabilă';
    return 'Potrivire slabă';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Căutăm potriviri pentru tine...</span>
        </div>
        
        {/* Loading skeletons */}
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg p-6 shadow-sm border animate-pulse">
            <div className="flex space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="w-16 h-6 bg-gray-200 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nu am găsit potriviri</h3>
        <p className="text-gray-600 mb-6">
          Încearcă să modifici ce cauți sau să adaugi mai multe cuvinte cheie în descriere.
        </p>
        <div className="bg-blue-50 rounded-lg p-4 text-left max-w-md mx-auto">
          <h4 className="font-medium text-blue-900 mb-2">💡 Sfaturi pentru mai multe potriviri:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Folosește cuvinte generale (ex: "laptop" în loc de "MacBook Pro 2020")</li>
            <li>• Adaugă sinonime și alternative</li>
            <li>• Activează opțiunea "schimb cu vacanță"</li>
            <li>• Încearcă categorii apropiete</li>
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">
          🎯 {matches.length} potriviri găsite
        </h3>
        <div className="text-sm text-gray-600">
          Pentru "{userObject.desired_items.slice(0, 30)}..."
        </div>
      </div>

      {matches.map(match => {
        const targetObject = getTargetObject(match);
        if (!targetObject) return null;

        return (
          <div
            key={match.object_id}
            className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedMatch(selectedMatch?.object_id === match.object_id ? null : match)}
          >
            <div className="flex space-x-4">
              {/* Object Image */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                  {targetObject.images.length > 0 ? (
                    <img
                      src={targetObject.images[0]}
                      alt={targetObject.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>
              </div>

              {/* Object Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 truncate">
                      {targetObject.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      📍 {targetObject.location} • {targetObject.condition}
                    </p>
                  </div>
                  
                  {/* Match Score */}
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(match.score)}`}>
                    {Math.round(match.score * 100)}%
                  </div>
                </div>

                <p className="text-gray-700 text-sm line-clamp-2 mb-3">
                  {targetObject.description}
                </p>

                {/* Match Reasons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {match.reasons.slice(0, 2).map((reason, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800"
                    >
                      ✓ {reason}
                    </span>
                  ))}
                  {match.reasons.length > 2 && (
                    <span className="text-xs text-gray-500">
                      +{match.reasons.length - 2} more
                    </span>
                  )}
                </div>

                {/* Quick Action Buttons */}
                <div className="flex space-x-2">
                  <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                    💬 Trimite mesaj
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                    🔄 Propune schimb
                  </button>
                  <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
                    👁️ Vezi detalii
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedMatch?.object_id === match.object_id && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Match Analysis */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">🔍 Analiza potrivirii</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Cuvinte cheie:</span>
                        <span className="font-medium">
                          {match.compatibility_details.keyword_matches.length > 0 
                            ? match.compatibility_details.keyword_matches.join(', ')
                            : 'Niciuna'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Categorie compatibilă:</span>
                        <span className={`font-medium ${match.compatibility_details.category_match ? 'text-green-600' : 'text-gray-500'}`}>
                          {match.compatibility_details.category_match ? 'Da' : 'Nu'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Locație apropiată:</span>
                        <span className={`font-medium ${match.compatibility_details.location_compatibility ? 'text-green-600' : 'text-gray-500'}`}>
                          {match.compatibility_details.location_compatibility ? 'Da' : 'Nu'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Valoare similară:</span>
                        <span className={`font-medium ${match.compatibility_details.value_compatibility ? 'text-green-600' : 'text-gray-500'}`}>
                          {match.compatibility_details.value_compatibility ? 'Da' : 'Nu'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Exchange Options */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-3">🤝 Opțiuni schimb</h5>
                    <div className="space-y-2 text-sm">
                      {targetObject.exchange_preferences.local && (
                        <div className="flex items-center text-green-700">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Schimb local
                        </div>
                      )}
                      {targetObject.exchange_preferences.courier && (
                        <div className="flex items-center text-blue-700">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                          Schimb prin curier
                        </div>
                      )}
                      {targetObject.exchange_preferences.travel && (
                        <div className="flex items-center text-purple-700">
                          <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                          Schimb cu vacanță
                        </div>
                      )}
                    </div>

                    {targetObject.estimated_value && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="text-sm">
                          <span className="text-gray-600">Valoare estimată:</span>
                          <span className="font-medium ml-2">{targetObject.estimated_value} RON</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Owner wants */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <h5 className="font-medium text-gray-900 mb-2">🔍 Proprietarul caută:</h5>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {targetObject.desired_items}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}