'use client';

import { useEffect } from 'react';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth/context';
import { initializeGoogleMaps } from '@/lib/google-maps/init';
import Header from './Header';
import BottomTabNavigation from './BottomTabNavigation';
import PWAInstallPrompt from './PWAInstallPrompt';
import PWAUpdateNotification from './PWAUpdateNotification';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  // Initialize Google Maps API once at app level
  useEffect(() => {
    initializeGoogleMaps();
  }, []);

  return (
    <I18nProvider>
      <AuthProvider>
        <Header />
        
        {/* Main Content with bottom padding for navigation */}
        <main className="mx-auto max-w-6xl px-4 py-8 pb-20">
          {children}
        </main>
        
        {/* Bottom Tab Navigation */}
        <BottomTabNavigation />
        
        {/* PWA Features */}
        <PWAInstallPrompt />
        <PWAUpdateNotification />
      </AuthProvider>
    </I18nProvider>
  );
}
