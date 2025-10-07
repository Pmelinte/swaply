'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ChatConversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
  };
  object: {
    id: string;
    name: string;
    image: string;
  };
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
    isFromMe: boolean;
  };
  status: 'active' | 'pending' | 'completed' | 'cancelled';
}

// Date mock pentru demonstrație
const MOCK_CONVERSATIONS: ChatConversation[] = [
  {
    id: '1',
    otherUser: {
      id: 'user1',
      name: 'Alexandru M.',
      avatar: 'AM'
    },
    object: {
      id: 'obj1',
      name: 'iPhone 14 Pro Max',
      image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400'
    },
    lastMessage: {
      content: 'Salut! Sunt interesat de schimbul cu iPhone-ul tău.',
      timestamp: '2 min',
      isRead: false,
      isFromMe: false
    },
    status: 'active'
  },
  {
    id: '2',
    otherUser: {
      id: 'user2',
      name: 'Maria S.',
      avatar: 'MS'
    },
    object: {
      id: 'obj2',
      name: 'MacBook Pro M2',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400'
    },
    lastMessage: {
      content: 'Perfect! Când ne putem întâlni pentru schimb?',
      timestamp: '1h',
      isRead: true,
      isFromMe: true
    },
    status: 'pending'
  },
  {
    id: '3',
    otherUser: {
      id: 'user3',
      name: 'Andrei P.',
      avatar: 'AP'
    },
    object: {
      id: 'obj3',
      name: 'PlayStation 5',
      image: 'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400'
    },
    lastMessage: {
      content: 'Mulțumesc pentru schimb! Totul a fost perfect.',
      timestamp: '1 zi',
      isRead: true,
      isFromMe: false
    },
    status: 'completed'
  },
  {
    id: '4',
    otherUser: {
      id: 'user4',
      name: 'Diana L.',
      avatar: 'DL'
    },
    object: {
      id: 'obj4',
      name: 'Samsung Galaxy S23',
      image: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400'
    },
    lastMessage: {
      content: 'Îmi pare rău, dar am schimbat deja obiectul.',
      timestamp: '2 zile',
      isRead: true,
      isFromMe: false
    },
    status: 'cancelled'
  }
];

const STATUS_LABELS = {
  active: { label: 'Activ', color: 'bg-green-500', icon: '💬' },
  pending: { label: 'În așteptare', color: 'bg-yellow-500', icon: '⏳' },
  completed: { label: 'Finalizat', color: 'bg-blue-500', icon: '✅' },
  cancelled: { label: 'Anulat', color: 'bg-red-500', icon: '❌' }
};

export default function ChatPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredConversations = MOCK_CONVERSATIONS.filter(conv => 
    selectedStatus === 'all' || conv.status === selectedStatus
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            💬 Conversațiile tale
          </h1>
          <p className="text-gray-600">
            Gestionează comunicarea cu ceilalți utilizatori pentru schimburi
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedStatus === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toate ({MOCK_CONVERSATIONS.length})
            </button>
            {Object.entries(STATUS_LABELS).map(([status, config]) => {
              const count = MOCK_CONVERSATIONS.filter(c => c.status === status).length;
              return (
                <button
                  key={status}
                  onClick={() => setSelectedStatus(status)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedStatus === status 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {config.icon} {config.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversations List */}
        <div className="space-y-4">
          {filteredConversations.map((conversation) => {
            const statusConfig = STATUS_LABELS[conversation.status];
            
            return (
              <div
                key={conversation.id}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Object Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={conversation.object.image}
                        alt={conversation.object.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    </div>

                    {/* Conversation Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 truncate">
                            {conversation.object.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {conversation.otherUser.avatar}
                              </div>
                              <span className="ml-2 text-sm text-gray-600">
                                {conversation.otherUser.name}
                              </span>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs text-white ${statusConfig.color}`}>
                              {statusConfig.icon} {statusConfig.label}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {conversation.lastMessage.timestamp}
                          </div>
                          {!conversation.lastMessage.isRead && !conversation.lastMessage.isFromMe && (
                            <div className="w-3 h-3 bg-blue-600 rounded-full mt-1 ml-auto"></div>
                          )}
                        </div>
                      </div>

                      {/* Last Message */}
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${
                          !conversation.lastMessage.isRead && !conversation.lastMessage.isFromMe
                            ? 'text-gray-900 font-medium'
                            : 'text-gray-600'
                        }`}>
                          {conversation.lastMessage.isFromMe && (
                            <span className="text-blue-600">Tu: </span>
                          )}
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <Link
                        href={`/chat/${conversation.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors"
                      >
                        💬 Deschide
                      </Link>
                      
                      {conversation.status === 'active' && (
                        <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
                          🤝 Finalizează
                        </button>
                      )}
                      
                      {conversation.status === 'pending' && (
                        <button className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700 transition-colors">
                          ⏳ Amintește
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredConversations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              Nu ai conversații
            </h3>
            <p className="text-gray-500 mb-6">
              Începe să cauți match-uri și să propui schimburi pentru a avea conversații
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/match"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                🎯 Vezi Match-uri
              </Link>
              <Link
                href="/obiecte/nou"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
              >
                ➕ Adaugă Obiect
              </Link>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
          <h3 className="font-semibold text-gray-900 mb-4">📊 Statistici Chat</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {MOCK_CONVERSATIONS.filter(c => c.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Conversații active</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {MOCK_CONVERSATIONS.filter(c => c.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">În așteptare</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {MOCK_CONVERSATIONS.filter(c => c.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Finalizate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {MOCK_CONVERSATIONS.filter(c => !c.lastMessage.isRead && !c.lastMessage.isFromMe).length}
              </div>
              <div className="text-sm text-gray-600">Mesaje necitite</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
