'use client';

import { useState } from 'react';
import { ChatInterface } from '@/components/ChatInterface';

export default function ChatDemoPage() {
  const [demoData] = useState({
    swapRequest: {
      id: 'demo-request-1',
      requested_item: {
        id: 'item-1',
        title: 'iPhone 13 Pro',
        category: 'Electronice',
        location: 'București',
        images: ['/demo-phone.jpg'],
        user_id: 'user-1'
      },
      offered_item: {
        id: 'item-2', 
        title: 'Laptop Gaming ASUS',
        category: 'Electronice',
        location: 'Cluj-Napoca',
        images: ['/demo-laptop.jpg'],
        user_id: 'user-2'
      },
      status: 'accepted',
      meeting_type: 'travel',
      travel_suggestion: {
        destination: { city: 'Brașov', country: 'România' },
        cost_estimate: { total: { min: 400, max: 600 }, currency: 'RON' }
      }
    },
    currentUserId: 'user-2'
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                💬 Demo Chat Real-time
              </h1>
              <p className="text-gray-600 mt-1">
                Demonstrație sistem chat cu Supabase Realtime
              </p>
            </div>
            <div className="text-sm text-gray-500">
              🟢 Demo Mode
            </div>
          </div>
        </div>
      </div>

      {/* Demo Info */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <span className="text-blue-600 text-lg">ℹ️</span>
            <div>
              <h3 className="font-medium text-blue-800 mb-2">
                Funcționalități Demo Chat:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Real-time messaging:</strong> Mesaje instant cu Supabase</li>
                <li>• <strong>Read receipts:</strong> Confirmări de citire automate</li>
                <li>• <strong>Typing indicators:</strong> Vezi când cineva scrie</li>
                <li>• <strong>Swap context:</strong> Detalii despre schimbul discutat</li>
                <li>• <strong>Travel integration:</strong> Sugestii călătorie integrate</li>
                <li>• <strong>Mobile responsive:</strong> Funcționează perfect pe mobile</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Chat Demo Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="h-[600px]">
            <ChatInterface
              swapRequestId={demoData.swapRequest.id}
              currentUserId={demoData.currentUserId}
              otherUserId="user-1"
              otherUserName="Ana Popescu"
              otherUserAvatar="/demo-avatar.jpg"
            />
          </div>
        </div>

        {/* Features Showcase */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-2">Real-time</h3>
            <p className="text-gray-600 text-sm">
              Mesajele apar instantaneu folosind Supabase Realtime subscriptions.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-2xl mb-3">✅</div>
            <h3 className="font-semibold text-gray-900 mb-2">Read Receipts</h3>
            <p className="text-gray-600 text-sm">
              Vezi când mesajele tale sunt citite de destinatar.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-2xl mb-3">💬</div>
            <h3 className="font-semibold text-gray-900 mb-2">Typing Status</h3>
            <p className="text-gray-600 text-sm">
              Indicatori live când cineva scrie un mesaj.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-2xl mb-3">🔄</div>
            <h3 className="font-semibold text-gray-900 mb-2">Swap Context</h3>
            <p className="text-gray-600 text-sm">
              Context complet despre obiectele discutate în schimb.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-2xl mb-3">✈️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Travel Info</h3>
            <p className="text-gray-600 text-sm">
              Sugestii călătorie integrate pentru schimburi la distanță.
            </p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-2xl mb-3">📱</div>
            <h3 className="font-semibold text-gray-900 mb-2">Mobile Ready</h3>
            <p className="text-gray-600 text-sm">
              Interface optimizată pentru toate dispozitivele.
            </p>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            🔧 Detalii Tehnice
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Backend Integration:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Supabase Realtime pentru mesaje live</li>
                <li>• PostgreSQL cu RLS policies</li>
                <li>• Triggers pentru read receipts</li>
                <li>• JSONB pentru metadata mesaje</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Frontend Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• React hooks pentru state management</li>
                <li>• Auto-scroll la mesaje noi</li>
                <li>• Optimistic UI updates</li>
                <li>• Responsive design cu TailwindCSS</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center space-x-4">
          <a
            href="/"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            ← Înapoi la Homepage
          </a>
          <a
            href="/cereri"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Vezi Cereri Schimb →
          </a>
        </div>
      </div>
    </div>
  );
}