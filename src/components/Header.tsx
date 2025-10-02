'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import NotificationSystem from './NotificationSystem';
import MobileMenu from './MobileMenu';
import { useI18n } from '@/lib/i18n';
import { useState, useEffect } from 'react';
import { getBrowserSupabase } from '@/lib/supabase/client';

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '';
  const isAuth = pathname?.startsWith('/login') || pathname?.startsWith('/signup');
  const { t } = useI18n();
  const [userId, setUserId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const supabase = getBrowserSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  return (
    <>
      <header className="bg-white/70 backdrop-blur border-b border-slate-200">
        <nav className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="font-semibold text-slate-900 text-lg">
            Swaply
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-4">
            {isHome ? (
              <div className="flex items-center gap-3">
                {userId && <NotificationSystem userId={userId} />}
                <Link href="/signup" className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">{t.common.signup}</Link>
                <Link href="/login" className="rounded-md border border-blue-600 px-3 py-1.5 text-blue-700 hover:bg-blue-50">{t.common.login}</Link>
                <LanguageSwitcher />
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/" className="hover:text-slate-900">{t.common.home}</Link>
                {userId && <NotificationSystem userId={userId} />}
                {!isAuth && (
                  <>
                    <Link href="/signup" className="text-blue-600 hover:text-blue-700">{t.common.signup}</Link>
                    <Link href="/login" className="text-blue-600 hover:text-blue-700">{t.common.login}</Link>
                  </>
                )}
                <LanguageSwitcher />
              </div>
            )}
          </div>

          {/* Mobile Menu Button & Notifications */}
          <div className="flex items-center gap-2 lg:hidden">
            {userId && <NotificationSystem userId={userId} />}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <span className="text-xl">☰</span>
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <MobileMenu 
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        userId={userId}
      />
    </>
  );
}