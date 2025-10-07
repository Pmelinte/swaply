'use client';

import { useState } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import TravelSuggestions from '@/components/TravelSuggestions';

// Temporary interface until travel suggestions are implemented
interface TravelSuggestion {
  destination: string;
  distance_km: number;
  estimated_cost: number;
  description: string;
  activities: string[];
  duration_days: number;
}

interface SwapRequestModalProps {
  swapItem: {
    id: string;
    title: string;
    category: string;
    location: string;
    exchange_preferences: {
      travel_willing: boolean;
      distance_limit_km: number;
    };
    user_id: string;
    images: string[];
  };
  myItem: {
    id: string;
    title: string;
    category: string;
    location: string;
    exchange_preferences: {
      travel_willing: boolean;
      distance_limit_km: number;
    };
    images: string[];
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function SwapRequestModal({ 
  swapItem, 
  myItem, 
  onClose, 
  onSuccess 
}: SwapRequestModalProps) {
  const [step, setStep] = useState<'form' | 'travel' | 'confirm'>('form');
  const [message, setMessage] = useState('');
  const [meetingType, setMeetingType] = useState<'local' | 'travel' | 'courier'>('local');
  const [selectedTravelSuggestion, setSelectedTravelSuggestion] = useState<TravelSuggestion | null>(null);
  const [loading, setLoading] = useState(false);

  const needsTravelSuggestions = () => {
    return meetingType === 'travel' && 
           swapItem.exchange_preferences.travel_willing && 
           myItem.exchange_preferences.travel_willing &&
           swapItem.location !== myItem.location;
  };

  const handleSubmitRequest = async () => {
    setLoading(true);
    try {
      const supabase = getBrowserSupabase();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const requestData = {
        requested_item_id: swapItem.id,
        offered_item_id: myItem.id,
        requester_id: user.id, // Current user
        owner_id: swapItem.user_id,
        message,
        meeting_type: meetingType,
        travel_suggestion: selectedTravelSuggestion ? {
          destination: selectedTravelSuggestion.destination,
          estimated_cost: selectedTravelSuggestion.estimated_cost,
          description: selectedTravelSuggestion.description,
          activities: selectedTravelSuggestion.activities,
          duration_days: selectedTravelSuggestion.duration_days
        } : null,
        status: 'pending'
      };

      const { error } = await supabase
        .from('swap_requests')
        .insert([requestData]);

      if (error) throw error;

      // Create notification for the owner
      await supabase
        .from('notifications')
        .insert([{
          user_id: swapItem.user_id,
          type: 'swap_request',
          title: 'Nouă cerere de schimb',
          content: `${myItem.title} pentru ${swapItem.title}`,
          metadata: {
            swap_request_id: requestData,
            requester_item: myItem.title,
            requested_item: swapItem.title
          }
        }]);

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating swap request:', error);
      alert('Eroare la trimiterea cererii. Încearcă din nou.');
    } finally {
      setLoading(false);
    }
  };

  const renderFormStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          📝 Detalii cerere schimb
        </h3>
        
        {/* Swap Preview */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* My Item */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                {myItem.images[0] ? (
                  <img 
                    src={myItem.images[0]} 
                    alt={myItem.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-gray-500 text-xl">📦</span>
                )}
              </div>
              <div className="font-medium text-sm">{myItem.title}</div>
              <div className="text-xs text-gray-600">{myItem.location}</div>
            </div>

            {/* Arrow */}
            <div className="text-center">
              <span className="text-2xl">⇄</span>
              <div className="text-sm text-gray-600 mt-1">Schimb</div>
            </div>

            {/* Their Item */}
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-300 rounded-lg mx-auto mb-2 flex items-center justify-center">
                {swapItem.images[0] ? (
                  <img 
                    src={swapItem.images[0]} 
                    alt={swapItem.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-gray-500 text-xl">📦</span>
                )}
              </div>
              <div className="font-medium text-sm">{swapItem.title}</div>
              <div className="text-xs text-gray-600">{swapItem.location}</div>
            </div>
          </div>
        </div>

        {/* Meeting Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Cum preferi să faci schimbul?
          </label>
          <div className="grid grid-cols-1 gap-3">
            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              meetingType === 'local' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                value="local"
                checked={meetingType === 'local'}
                onChange={(e) => setMeetingType(e.target.value as any)}
                className="sr-only"
              />
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🤝</span>
                <div>
                  <div className="font-medium">Întâlnire locală</div>
                  <div className="text-sm text-gray-600">Ne întâlnim într-un loc public pentru schimb</div>
                </div>
              </div>
            </label>

            {swapItem.exchange_preferences.travel_willing && myItem.exchange_preferences.travel_willing && (
              <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                meetingType === 'travel' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input
                  type="radio"
                  value="travel"
                  checked={meetingType === 'travel'}
                  onChange={(e) => setMeetingType(e.target.value as any)}
                  className="sr-only"
                />
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">✈️</span>
                  <div>
                    <div className="font-medium">Călătorie împreună</div>
                    <div className="text-sm text-gray-600">Facem schimbul într-o destinație de vacanță</div>
                  </div>
                </div>
              </label>
            )}

            <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              meetingType === 'courier' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input
                type="radio"
                value="courier"
                checked={meetingType === 'courier'}
                onChange={(e) => setMeetingType(e.target.value as any)}
                className="sr-only"
              />
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📦</span>
                <div>
                  <div className="font-medium">Livrare prin curier</div>
                  <div className="text-sm text-gray-600">Trimitem obiectele prin poștă/curier</div>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Message */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mesaj pentru proprietar (opțional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Salut! Sunt interesat să fac schimb. Obiectul meu este..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
          <div className="text-xs text-gray-500 mt-1">
            {message.length}/500 caractere
          </div>
        </div>
      </div>
    </div>
  );

  const renderTravelStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          ✈️ Sugestii destinații de vacanță
        </h3>
        <p className="text-gray-600 mb-6">
          Alegeți o destinație unde să vă întâlniți și să faceți o minivacanță împreună!
        </p>
      </div>

      <TravelSuggestions
        location1={myItem.location}
        location2={swapItem.location}
        onSuggestionSelect={setSelectedTravelSuggestion}
      />

      {selectedTravelSuggestion && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-green-600">✅</span>
            <span className="font-medium text-green-800">
              Destinația selectată: {selectedTravelSuggestion.destination}
            </span>
          </div>
          <p className="text-sm text-green-700">
            Această sugestie va fi inclusă în cererea de schimb și va putea fi discutată în chat.
          </p>
        </div>
      )}
    </div>
  );

  const renderConfirmStep = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ✅ Confirmă cererea de schimb
        </h3>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-6 space-y-4">
        <div>
          <div className="font-medium text-gray-900">Schimb propus:</div>
          <div className="text-gray-600">{myItem.title} ⇄ {swapItem.title}</div>
        </div>

        <div>
          <div className="font-medium text-gray-900">Tip întâlnire:</div>
          <div className="text-gray-600">
            {meetingType === 'local' && '🤝 Întâlnire locală'}
            {meetingType === 'travel' && '✈️ Călătorie împreună'}
            {meetingType === 'courier' && '📦 Livrare prin curier'}
          </div>
        </div>

        {selectedTravelSuggestion && (
          <div>
            <div className="font-medium text-gray-900">Destinația propusă:</div>
            <div className="text-gray-600">
              📍 {selectedTravelSuggestion.destination}
              <span className="ml-2 text-sm">
                ({selectedTravelSuggestion.estimated_cost} RON)
              </span>
            </div>
          </div>
        )}

        {message && (
          <div>
            <div className="font-medium text-gray-900">Mesajul tău:</div>
            <div className="text-gray-600 text-sm bg-white p-3 rounded border">
              {message}
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <span className="text-blue-600 text-lg">ℹ️</span>
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">Ce se întâmplă după trimiterea cererii:</div>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Proprietarul va primi o notificare</li>
              <li>Poate accepta, refuza sau negocia cererea</li>
              <li>Dacă acceptă, veți putea chata pentru a planifica schimbul</li>
              <li>După schimb, vă puteți evalua reciproc</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 'form' && '📝 Cerere de schimb'}
              {step === 'travel' && '✈️ Sugestii călătorie'}
              {step === 'confirm' && '✅ Confirmă cererea'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Pasul {step === 'form' ? '1' : step === 'travel' ? '2' : '3'} din {needsTravelSuggestions() ? '3' : '2'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="text-2xl">×</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50">
          <div className="flex items-center space-x-2">
            <div className={`flex-1 h-2 rounded-full ${
              step === 'form' ? 'bg-blue-500' : 'bg-green-500'
            }`}></div>
            {needsTravelSuggestions() && (
              <div className={`flex-1 h-2 rounded-full ${
                step === 'form' ? 'bg-gray-200' : step === 'travel' ? 'bg-blue-500' : 'bg-green-500'
              }`}></div>
            )}
            <div className={`flex-1 h-2 rounded-full ${
              step === 'confirm' ? 'bg-blue-500' : 'bg-gray-200'
            }`}></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {step === 'form' && renderFormStep()}
          {step === 'travel' && renderTravelStep()}
          {step === 'confirm' && renderConfirmStep()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div>
            {step !== 'form' && (
              <button
                onClick={() => {
                  if (step === 'travel') setStep('form');
                  if (step === 'confirm') setStep(needsTravelSuggestions() ? 'travel' : 'form');
                }}
                className="text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Înapoi
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Anulează
            </button>
            
            <button
              onClick={() => {
                if (step === 'form') {
                  if (needsTravelSuggestions()) {
                    setStep('travel');
                  } else {
                    setStep('confirm');
                  }
                } else if (step === 'travel') {
                  setStep('confirm');
                } else {
                  handleSubmitRequest();
                }
              }}
              disabled={loading || (step === 'travel' && !selectedTravelSuggestion)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Se trimite...</span>
                </div>
              ) : (
                <>
                  {step === 'form' && (needsTravelSuggestions() ? 'Continuă →' : 'Confirmă cererea')}
                  {step === 'travel' && 'Continuă →'}
                  {step === 'confirm' && '📤 Trimite cererea'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}