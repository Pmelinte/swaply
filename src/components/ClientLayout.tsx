'use client';

import { I18nProvider } from '@/lib/i18n';
import Header from './Header';
import BottomTabNavigation from './BottomTabNavigation';
import { useState, useEffect } from 'react';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userId, setUserId] = useState<string>();

  // Mock auth state - replace with real Supabase auth
  useEffect(() => {
    // Simulate checking auth status
    const checkAuth = () => {
      // This should be replaced with real Supabase auth check
      const mockUserId = 'user-123'; // Mock user ID
      setIsLoggedIn(!!mockUserId);
      setUserId(mockUserId);
    };
    
    checkAuth();
  }, []);

  return (
    <I18nProvider>
      <Header />
      
      {/* Main Content with bottom padding for navigation */}
      <main className="mx-auto max-w-6xl px-4 py-8 pb-20">
        {children}
      </main>
      
      {/* Bottom Tab Navigation */}
      <BottomTabNavigation userId={userId} />
    </I18nProvider>
  );
}
