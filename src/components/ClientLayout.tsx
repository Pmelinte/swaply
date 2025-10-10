'use client';

import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth/context';
import Header from './Header';
import BottomTabNavigation from './BottomTabNavigation';

export function ClientLayout({ children }: { children: React.ReactNode }) {
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
      </AuthProvider>
    </I18nProvider>
  );
}
