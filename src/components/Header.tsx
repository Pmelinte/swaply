'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const infoLinks = [
  { href: '/info/despre', label: 'Despre' },
  { href: '/info/cum-functioneaza', label: 'Cum funcționează' },
  { href: '/info/intrebari-frecvente', label: 'Întrebări frecvente' },
  { href: '/info/termeni', label: 'Termeni' },
  { href: '/info/confidentialitate', label: 'Confidențialitate' },
  { href: '/info/contact', label: 'Contact' },
];

export default function Header() {
  const pathname = usePathname();
  const isHome = pathname === '/' || pathname === '';
  const isInfo = pathname?.startsWith('/info');
  const isAuth = pathname?.startsWith('/login') || pathname?.startsWith('/signup');

  return (
    <header className="bg-white/70 backdrop-blur border-b border-slate-200">
      <nav className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-700">
        <Link href="/" className="font-semibold text-slate-900">Swaply</Link>
        <div className="flex-1" />
        {isHome && (
          <div className="flex items-center gap-3">
            <Link href="/signup" className="rounded-md bg-blue-600 px-3 py-1.5 text-white hover:bg-blue-700">Înregistrare</Link>
            <Link href="/login" className="rounded-md border border-blue-600 px-3 py-1.5 text-blue-700 hover:bg-blue-50">Autentificare</Link>
            <Link href="/info" className="text-slate-600 hover:text-slate-900">Info</Link>
          </div>
        )}
        {isInfo && (
          <div className="flex flex-wrap items-center gap-3">
            {infoLinks.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-slate-900">
                {l.label}
              </Link>
            ))}
          </div>
        )}
        {isAuth && (
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:text-slate-900">Acasă</Link>
            <Link href="/info" className="hover:text-slate-900">Info</Link>
          </div>
        )}
        {!isHome && !isInfo && !isAuth && (
          <div className="flex items-center gap-3">
            <Link href="/" className="hover:text-slate-900">Acasă</Link>
            <Link href="/signup" className="text-blue-600 hover:text-blue-700">Înregistrare</Link>
            <Link href="/login" className="text-blue-600 hover:text-blue-700">Autentificare</Link>
          </div>
        )}
      </nav>
    </header>
  );
}
