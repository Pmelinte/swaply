'use client';

import { useState } from 'react';
import Link from 'next/link';
import NotificationSystem from './NotificationSystem';
import { useAuth } from '@/lib/auth/context';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  action?: string;
  badge?: number;
}

interface TopMenuProps {
  isLoggedIn?: boolean;
  userName?: string;
  notificationCount?: number;
}

export default function TopMenu({ isLoggedIn = false, userName, notificationCount = 0 }: TopMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
  };

  const menuItems: MenuItem[] = isLoggedIn ? [
    { id: 'preferences', label: 'Preferințe AI', icon: '🤖', href: '/preferinte' },
    { id: 'language', label: 'Limba', icon: '🌍', href: '/limba' },
    { id: 'theme', label: 'Mod întunecat', icon: '🌙', action: 'toggle-theme' },
    { id: 'help', label: 'Ajutor', icon: '❓', href: '/ajutor' },
    { id: 'logout', label: 'Deconectare', icon: '🚪', action: 'logout' },
  ] : [
    { id: 'login', label: 'Conectează-te', icon: '🔑', href: '/login' },
    { id: 'signup', label: 'Înregistrează-te', icon: '👤', href: '/signup' },
    { id: 'language', label: 'Limba', icon: '🌍', href: '/limba' },
  ];

  return (
    <div className="flex items-center space-x-2">
      {/* Notification System for logged in users */}
      {isLoggedIn && user && (
        <NotificationSystem userId={user.id} />
      )}
      
      {/* Main Menu */}
      <div className="relative">
      {/* Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-900 transition-colors relative"
        aria-label="Meniu principal"
      >
        <span className="text-xl">⋯</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu Content */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
            {/* User Info (if logged in) */}
            {isLoggedIn && userName && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{userName}</p>
                    <p className="text-sm text-gray-500">Membru Swaply</p>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="py-2">
              {menuItems.map((item) => (
                <div key={item.id}>
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-gray-700">{item.label}</span>
                      </div>
                      
                      {item.badge && item.badge > 0 && (
                        <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                          {item.badge > 9 ? '9+' : item.badge}
                        </div>
                      )}
                    </Link>
                  ) : (
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      onClick={() => {
                        if (item.action === 'toggle-theme') {
                          // Theme toggle logic here
                          console.log('Toggle theme');
                        } else if (item.action === 'logout') {
                          handleLogout();
                        }
                        setIsOpen(false);
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-gray-700">{item.label}</span>
                      </div>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* App Version (bottom) */}
            <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                Swaply v2.0 • AI Enhanced
              </p>
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}