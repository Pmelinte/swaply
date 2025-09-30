'use client';

import { I18nProvider } from '@/lib/i18n';
import Header from './Header';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </I18nProvider>
  );
}
