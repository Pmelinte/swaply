'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useI18n } from '@/lib/i18n';

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '';
  const isAuth = pathname?.startsWith('/login') || pathname?.startsWith('/signup');
  const { t } = useI18n();

  return (
    <header className="bg-white/70 backdrop-blur border-b border-slate-200">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-700">
        <Link href="/" className="font-semibold text-slate-900">Swaply</Link>
        <div className="flex-1" />

        {isHome ? (
          <div className="flex items-center gap-3">
            <Link href="/signup" className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">{t.common.signup}</Link>
            <Link href="/login" className="rounded-md border border-blue-600 px-3 py-1.5 text-blue-700 hover:bg-blue-50">{t.common.login}</Link>
            <LanguageSwitcher />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:text-slate-900">{t.common.home}</Link>
            {!isAuth && (
              <>
                <Link href="/signup" className="text-blue-600 hover:text-blue-700">{t.common.signup}</Link>
                <Link href="/login" className="text-blue-600 hover:text-blue-700">{t.common.login}</Link>
              </>
            )}
            <LanguageSwitcher />
          </div>
        )}
      </nav>
    </header>
  );
}