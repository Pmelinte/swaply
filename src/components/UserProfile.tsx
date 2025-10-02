'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';

export function UserProfile() {
  const { t } = useI18n();
  const [user] = useState({
    name: 'Petru Melinte',
    email: 'pmelinte@gmail.com',
    avatar: '/no-image.svg',
    location: 'București, România',
    rating: 4.8,
    swapsCount: 15,
    phone: '+40 123 456 789',
    username: '@pmelinte'
  });

  return (
    <div className="p-6 border-b border-gray-200">
      {/* Welcome Message */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Swaply</h1>
        <p className="text-sm text-gray-600">Schimbă obiectele tale cu altele de care ai nevoie</p>
      </div>

      {/* User Avatar & Basic Info */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
          {user.name.charAt(0)}
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-gray-800">{user.name}</h2>
          <p className="text-sm text-gray-600">{user.username}</p>
          <div className="flex items-center mt-1">
            <span className="text-yellow-500">★</span>
            <span className="text-sm text-gray-600 ml-1">{user.rating} ({user.swapsCount} schimburi)</span>
          </div>
        </div>
      </div>

      {/* User Details */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">📧 Email:</span>
          <span className="text-gray-800">{user.email}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">📱 Telefon:</span>
          <span className="text-gray-800">{user.phone}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">📍 Locație:</span>
          <span className="text-gray-800">{user.location}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">🏆 Status Swaply:</span>
          <span className="text-green-600 font-medium">Gold</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 space-y-2">
        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
          + Adaugă Obiect de Schimbat
        </button>
        <button className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors">
          Vezi Obiectele Mele
        </button>
        <button className="w-full bg-red-100 text-red-700 py-2 px-4 rounded-lg hover:bg-red-200 transition-colors">
          Logout
        </button>
      </div>
    </div>
  );
}