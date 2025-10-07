'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface TabBadge {
  count: number;
  type: 'notification' | 'message' | 'match';
}

interface BottomTabProps {
  userId?: string;
}

export default function BottomTabNavigation({ userId }: BottomTabProps) {
  const pathname = usePathname();
  const [badges, setBadges] = useState<Record<string, TabBadge>>({});

  // Simulate badge counts - in real app this would come from Supabase
  useEffect(() => {
    if (userId) {
      // Mock data - replace with real API calls
      setBadges({
        chat: { count: 3, type: 'message' },
        match: { count: 2, type: 'match' },
        home: { count: 1, type: 'notification' }
      });
    }
  }, [userId]);

  const tabs = [
    {
      id: 'home',
      path: '/',
      icon: '🏠',
      label: 'Home',
      activeIcon: '🏠',
    },
    {
      id: 'objects',
      path: '/obiecte',
      icon: '🎒',
      label: 'Obiecte',
      activeIcon: '🎒',
    },
    {
      id: 'match',
      path: '/match',
      icon: '🔗',
      label: 'Matching',
      activeIcon: '🔗',
    },
    {
      id: 'chat',
      path: '/chat',
      icon: '💬',
      label: 'Chat',
      activeIcon: '💬',
    },
    {
      id: 'info',
      path: '/profil',
      icon: '👤',
      label: 'Info',
      activeIcon: '👤',
    },
  ];

  const isTabActive = (tabPath: string) => {
    if (tabPath === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(tabPath);
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'message': return 'bg-blue-500';
      case 'match': return 'bg-green-500';
      case 'notification': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const isActive = isTabActive(tab.path);
          const badge = badges[tab.id];
          
          return (
            <Link
              key={tab.id}
              href={tab.path}
              className={`
                flex flex-col items-center justify-center min-w-0 flex-1 py-1 px-1 relative
                transition-colors duration-200 rounded-lg
                ${isActive 
                  ? 'text-blue-600 bg-blue-50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              {/* Badge */}
              {badge && badge.count > 0 && (
                <div className={`
                  absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center
                  text-xs font-bold text-white ${getBadgeColor(badge.type)}
                  ${badge.count > 99 ? 'px-1' : ''}
                `}>
                  {badge.count > 99 ? '99+' : badge.count}
                </div>
              )}
              
              {/* Icon */}
              <div className="text-xl mb-1">
                {isActive ? tab.activeIcon : tab.icon}
              </div>
              
              {/* Label */}
              <span className={`
                text-xs font-medium truncate w-full text-center
                ${isActive ? 'text-blue-600' : 'text-gray-600'}
              `}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}