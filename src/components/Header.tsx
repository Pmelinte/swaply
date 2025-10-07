'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TopMenu from './TopMenu';
import { useState, useEffect } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const getUser = async () => {
      const supabase = getBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        // Mock notification count - replace with real Supabase query
        setNotificationCount(5);
      }
    };
    getUser();
  }, []);

  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl">🔄</span>
          <span className="font-bold text-xl text-gray-900">Swaply</span>
        </Link>

        {/* Global Search - Desktop */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Caută obiecte..."
              className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-full border-0 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
        </div>

        {/* Global Search - Mobile */}
        <button className="md:hidden p-2 text-gray-600 hover:text-gray-900">
          <span className="text-xl">🔍</span>
        </button>

        {/* Top Menu */}
        <TopMenu 
          isLoggedIn={!!user}
          userName={user?.user_metadata?.name || user?.email}
          notificationCount={notificationCount}
        />
      </nav>
    </header>
  );
}