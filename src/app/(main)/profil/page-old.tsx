'use client';

import { useState, useEffect } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';
import Link from 'next/link';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  location?: string;
  bio?: string;
  joined_date: string;
  objects_count: number;
  successful_swaps: number;
  rating: number;
  badges: string[];
}

const MOCK_USER: UserProfile = {
  id: 'user1',
  name: 'Alexandru Popescu',
  email: 'alex.popescu@email.com',
  location: 'București',
  bio: 'Pasionat de tehnologie și gadgeturi. Îmi place să descopăr obiecte noi și să fac schimburi interesante cu comunitatea Swaply.',
  joined_date: '2024-08-15',
  objects_count: 12,
  successful_swaps: 8,
  rating: 4.8,
  badges: ['🏆 Top Trader', '⭐ Verified User', '🤝 Trustworthy', '📱 Tech Expert']
};

const MOCK_USER_OBJECTS = [
  {
    id: '1',
    name: 'iPhone 14 Pro Max',
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200',
    status: 'active',
    views: 45,
    likes: 12
  },
  {
    id: '2',
    name: 'MacBook Pro M2',
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=200',
    status: 'swapped',
    views: 38,
    likes: 9
  },
  {
    id: '3',
    name: 'AirPods Pro 2',
    image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=200',
    status: 'active',
    views: 23,
    likes: 6
  }
];

const RECENT_ACTIVITY = [
  {
    id: '1',
    type: 'swap_completed',
    description: 'Schimb finalizat cu Maria S. - MacBook Pro → iPad Pro',
    date: '2024-10-05',
    icon: '✅'
  },
  {
    id: '2',
    type: 'object_added',
    description: 'Obiect nou adăugat: iPhone 14 Pro Max',
    date: '2024-10-03',
    icon: '➕'
  },
  {
    id: '3',
    type: 'rating_received',
    description: 'Evaluare primită de la Andrei P. - 5 stele',
    date: '2024-10-02',
    icon: '⭐'
  },
  {
    id: '4',
    type: 'match_found',
    description: 'Potrivire nouă găsită pentru AirPods Pro',
    date: '2024-10-01',
    icon: '🎯'
  }
];

export default function ProfilPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Mock user data - replace with real Supabase query
    setUser(MOCK_USER);
  }, []);

  const handleSaveProfile = () => {
    // Mock save - replace with real implementation
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm">
                ✓
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }, (_, i) => (
                    <span key={i} className={i < Math.floor(user.rating) ? 'text-yellow-400' : 'text-gray-300'}>
                      ⭐
                    </span>
                  ))}
                  <span className="text-gray-600 ml-1">({user.rating})</span>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {user.badges.map((badge, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {badge}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{user.objects_count}</div>
                  <div className="text-sm text-gray-600">Obiecte</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{user.successful_swaps}</div>
                  <div className="text-sm text-gray-600">Schimburi</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {new Date().getFullYear() - new Date(user.joined_date).getFullYear()}+
                  </div>
                  <div className="text-sm text-gray-600">Ani</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isEditing ? '💾 Salvează' : '✏️ Editează'}
              </button>
              <Link
                href="/obiecte/nou"
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center"
              >
                ➕ Adaugă Obiect
              </Link>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Despre mine</h3>
              {isEditing ? (
                <textarea
                  defaultValue={user.bio}
                  className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                  rows={3}
                />
              ) : (
                <p className="text-gray-600">{user.bio}</p>
              )}
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'overview', label: '📊 Prezentare', icon: '📊' },
              { id: 'objects', label: '📦 Obiectele Mele', icon: '📦' },
              { id: 'activity', label: '📈 Activitate', icon: '📈' },
              { id: 'settings', label: '⚙️ Setări', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl mb-2">👁️</div>
                    <div className="text-lg font-bold text-blue-600">1,234</div>
                    <div className="text-sm text-gray-600">Vizualizări</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl mb-2">❤️</div>
                    <div className="text-lg font-bold text-green-600">89</div>
                    <div className="text-sm text-gray-600">Favorite</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl mb-2">💬</div>
                    <div className="text-lg font-bold text-purple-600">45</div>
                    <div className="text-sm text-gray-600">Mesaje</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl mb-2">🎯</div>
                    <div className="text-lg font-bold text-yellow-600">23</div>
                    <div className="text-sm text-gray-600">Match-uri</div>
                  </div>
                </div>

                {/* Recent Objects */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Obiectele mele recente</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {MOCK_USER_OBJECTS.map(obj => (
                      <div key={obj.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <img src={obj.image} alt={obj.name} className="w-full h-32 object-cover rounded-lg mb-3" />
                        <h4 className="font-medium text-gray-900 mb-2">{obj.name}</h4>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>👁️ {obj.views}</span>
                          <span>❤️ {obj.likes}</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            obj.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {obj.status === 'active' ? 'Activ' : 'Schimbat'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Objects Tab */}
            {activeTab === 'objects' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Toate obiectele mele</h3>
                  <Link
                    href="/obiecte/nou"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    ➕ Obiect nou
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {MOCK_USER_OBJECTS.map(obj => (
                    <div key={obj.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <img src={obj.image} alt={obj.name} className="w-full h-40 object-cover rounded-lg mb-4" />
                      <h4 className="font-medium text-gray-900 mb-2">{obj.name}</h4>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          obj.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {obj.status === 'active' ? 'Activ' : 'Schimbat'}
                        </span>
                        <div className="flex gap-2 text-sm text-gray-600">
                          <span>👁️ {obj.views}</span>
                          <span>❤️ {obj.likes}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="flex-1 bg-blue-100 text-blue-700 py-2 px-3 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                          ✏️ Editează
                        </button>
                        <button className="flex-1 bg-red-100 text-red-700 py-2 px-3 rounded-lg text-sm hover:bg-red-200 transition-colors">
                          🗑️ Șterge
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Activitatea recentă</h3>
                <div className="space-y-4">
                  {RECENT_ACTIVITY.map(activity => (
                    <div key={activity.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl">{activity.icon}</div>
                      <div className="flex-1">
                        <p className="text-gray-900">{activity.description}</p>
                        <p className="text-sm text-gray-600">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Setări profil</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nume</label>
                      <input type="text" defaultValue={user.name} className="w-full p-3 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input type="email" defaultValue={user.email} className="w-full p-3 border border-gray-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Locația</label>
                      <input type="text" defaultValue={user.location} className="w-full p-3 border border-gray-300 rounded-lg" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferințe notificări</h3>
                  <div className="space-y-3">
                    {[
                      'Notificări pentru match-uri noi',
                      'Notificări pentru mesaje',
                      'Notificări pentru cereri de schimb',
                      'Newsletter săptămânal'
                    ].map((setting, index) => (
                      <label key={index} className="flex items-center">
                        <input type="checkbox" defaultChecked className="mr-3" />
                        <span className="text-gray-700">{setting}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  💾 Salvează Modificările
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}