'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SwapRequest {
  id: string;
  type: 'incoming' | 'outgoing';
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  object_offered: {
    id: string;
    name: string;
    image: string;
    user: {
      name: string;
      avatar: string;
    };
  };
  object_requested: {
    id: string;
    name: string;
    image: string;
    user: {
      name: string;
      avatar: string;
    };
  };
  message?: string;
  created_at: string;
  updated_at: string;
  meeting_location?: string;
  estimated_date?: string;
}

// Date mock pentru demonstrație
const MOCK_SWAP_REQUESTS: SwapRequest[] = [
  {
    id: '1',
    type: 'incoming',
    status: 'pending',
    object_offered: {
      id: 'obj1',
      name: 'MacBook Pro M2 14"',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200',
      user: { name: 'Maria S.', avatar: 'MS' }
    },
    object_requested: {
      id: 'obj2',
      name: 'iPhone 14 Pro Max',
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200',
      user: { name: 'Tu', avatar: 'TU' }
    },
    message: 'Salut! Sunt foarte interesată de iPhone-ul tău. MacBook-ul meu este în stare perfectă, am toate documentele.',
    created_at: '2024-10-06T10:30:00Z',
    updated_at: '2024-10-06T10:30:00Z'
  },
  {
    id: '2',
    type: 'outgoing',
    status: 'accepted',
    object_offered: {
      id: 'obj3',
      name: 'iPad Pro 12.9"',
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200',
      user: { name: 'Tu', avatar: 'TU' }
    },
    object_requested: {
      id: 'obj4',
      name: 'PlayStation 5',
      image: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=200',
      user: { name: 'Andrei P.', avatar: 'AP' }
    },
    message: 'Perfect! Când ne putem întâlni pentru schimb?',
    created_at: '2024-10-05T14:20:00Z',
    updated_at: '2024-10-06T09:15:00Z',
    meeting_location: 'Piața Unirii, București',
    estimated_date: '2024-10-08'
  },
  {
    id: '3',
    type: 'incoming',
    status: 'completed',
    object_offered: {
      id: 'obj5',
      name: 'Samsung Galaxy S23',
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=200',
      user: { name: 'Diana L.', avatar: 'DL' }
    },
    object_requested: {
      id: 'obj6',
      name: 'AirPods Pro 2',
      image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=200',
      user: { name: 'Tu', avatar: 'TU' }
    },
    message: 'Mulțumesc pentru schimb! Totul a fost perfect.',
    created_at: '2024-10-03T11:15:00Z',
    updated_at: '2024-10-04T16:30:00Z'
  },
  {
    id: '4',
    type: 'outgoing',
    status: 'declined',
    object_offered: {
      id: 'obj7',
      name: 'Apple Watch Series 8',
      image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200',
      user: { name: 'Tu', avatar: 'TU' }
    },
    object_requested: {
      id: 'obj8',
      name: 'Nintendo Switch OLED',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200',
      user: { name: 'Bogdan R.', avatar: 'BR' }
    },
    message: 'Îmi pare rău, dar am găsit o ofertă mai bună.',
    created_at: '2024-10-02T09:45:00Z',
    updated_at: '2024-10-02T15:20:00Z'
  }
];

const STATUS_CONFIG = {
  pending: { label: 'În așteptare', color: 'bg-yellow-500', icon: '⏳' },
  accepted: { label: 'Acceptat', color: 'bg-green-500', icon: '✅' },
  declined: { label: 'Refuzat', color: 'bg-red-500', icon: '❌' },
  completed: { label: 'Finalizat', color: 'bg-blue-500', icon: '🎉' },
  cancelled: { label: 'Anulat', color: 'bg-gray-500', icon: '🚫' }
};

export default function SchimbPage() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredRequests = MOCK_SWAP_REQUESTS.filter(request => {
    const typeMatch = selectedTab === 'all' || request.type === selectedTab;
    const statusMatch = selectedStatus === 'all' || request.status === selectedStatus;
    return typeMatch && statusMatch;
  });

  const getTimeAgo = (dateString: string) => {
    const now = new Date().getTime();
    const reqTime = new Date(dateString).getTime();
    const diffHours = Math.floor((now - reqTime) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Acum';
    if (diffHours < 24) return `${diffHours}h`;
    return `${Math.floor(diffHours / 24)}z`;
  };

  const handleAcceptRequest = (requestId: string) => {
    console.log('Accept request:', requestId);
    // Mock implementation - replace with real action
  };

  const handleDeclineRequest = (requestId: string) => {
    console.log('Decline request:', requestId);
    // Mock implementation - replace with real action
  };

  const handleCompleteSwap = (requestId: string) => {
    console.log('Complete swap:', requestId);
    // Mock implementation - replace with real action
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🤝 Gestionează Schimburile
          </h1>
          <p className="text-gray-600">
            Urmărește și gestionează toate cererile de schimb
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {MOCK_SWAP_REQUESTS.filter(r => r.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">În așteptare</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {MOCK_SWAP_REQUESTS.filter(r => r.status === 'accepted').length}
            </div>
            <div className="text-sm text-gray-600">Acceptate</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {MOCK_SWAP_REQUESTS.filter(r => r.status === 'completed').length}
            </div>
            <div className="text-sm text-gray-600">Finalizate</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">
              {MOCK_SWAP_REQUESTS.length}
            </div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200 mb-4">
            {[
              { id: 'all', label: 'Toate', count: MOCK_SWAP_REQUESTS.length },
              { id: 'incoming', label: 'Primite', count: MOCK_SWAP_REQUESTS.filter(r => r.type === 'incoming').length },
              { id: 'outgoing', label: 'Trimise', count: MOCK_SWAP_REQUESTS.filter(r => r.type === 'outgoing').length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`py-2 px-4 font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrează după status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Toate statusurile</option>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <option key={status} value={status}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Swap Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🤝</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nu ai cereri de schimb
            </h3>
            <p className="text-gray-500 mb-6">
              Începe să cauți obiecte și să propui schimburi
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/match"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🎯 Vezi Match-uri
              </Link>
              <Link
                href="/obiecte"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                📦 Explorează Obiecte
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredRequests.map((request) => {
              const statusConfig = STATUS_CONFIG[request.status];
              
              return (
                <div key={request.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {request.type === 'incoming' ? '📥' : '📤'}
                        </span>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.type === 'incoming' ? 'Cerere primită' : 'Cerere trimisă'}
                        </h3>
                        <div className={`px-3 py-1 rounded-full text-white text-sm ${statusConfig.color}`}>
                          {statusConfig.icon} {statusConfig.label}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {getTimeAgo(request.updated_at)}
                      </div>
                    </div>
                  </div>

                  {/* Objects Exchange */}
                  <div className="p-6">
                    <div className="flex items-center gap-6 mb-4">
                      {/* Offered Object */}
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-2">
                          {request.type === 'incoming' ? 'Oferă:' : 'Tu oferi:'}
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <img
                            src={request.object_offered.image}
                            alt={request.object_offered.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{request.object_offered.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                                {request.object_offered.user.avatar}
                              </div>
                              <span className="text-sm text-gray-600">{request.object_offered.user.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Exchange Arrow */}
                      <div className="text-2xl text-gray-400">⇄</div>

                      {/* Requested Object */}
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-2">
                          {request.type === 'incoming' ? 'Pentru:' : 'Vrei:'}
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <img
                            src={request.object_requested.image}
                            alt={request.object_requested.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{request.object_requested.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs">
                                {request.object_requested.user.avatar}
                              </div>
                              <span className="text-sm text-gray-600">{request.object_requested.user.name}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    {request.message && (
                      <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-2">Mesaj:</div>
                        <div className="p-3 bg-blue-50 rounded-lg text-gray-800">
                          "{request.message}"
                        </div>
                      </div>
                    )}

                    {/* Meeting Details */}
                    {request.meeting_location && request.estimated_date && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg">
                        <div className="text-sm font-medium text-green-900 mb-1">📍 Detalii întâlnire:</div>
                        <div className="text-sm text-green-800">
                          <div>Locația: {request.meeting_location}</div>
                          <div>Data estimată: {new Date(request.estimated_date).toLocaleDateString('ro-RO')}</div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      {request.type === 'incoming' && request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            ✅ Acceptă
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                          >
                            ❌ Refuză
                          </button>
                        </>
                      )}

                      {request.status === 'accepted' && (
                        <button
                          onClick={() => handleCompleteSwap(request.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          🎉 Marchează ca finalizat
                        </button>
                      )}

                      <Link
                        href={`/chat/${request.id}`}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        💬 Mesaj
                      </Link>

                      {request.status === 'completed' && (
                        <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors">
                          ⭐ Evaluează
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}