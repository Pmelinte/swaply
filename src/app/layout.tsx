import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Swaply',
  description: 'Găsește partenerul potrivit pentru schimb de locuințe.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className={`${inter.className} min-h-screen bg-slate-50 antialiased`}> 
        <header className="bg-white/70 backdrop-blur border-b border-slate-200">
          <nav className="mx-auto max-w-6xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-700">
            <Link href="/" className="font-semibold text-slate-900">Swaply</Link>
            <div className="flex-1" />
            <div className="flex flex-wrap gap-3">
              <Link href="/despre" className="hover:text-slate-900">Despre</Link>
              <Link href="/cum-functioneaza" className="hover:text-slate-900">Cum funcționează</Link>
              <Link href="/intrebari-frecvente" className="hover:text-slate-900">Întrebări frecvente</Link>
              <Link href="/termeni" className="hover:text-slate-900">Termeni</Link>
              <Link href="/confidentialitate" className="hover:text-slate-900">Confidențialitate</Link>
              <Link href="/contact" className="hover:text-slate-900">Contact</Link>
              <Link href="/signup" className="text-blue-600 hover:text-blue-700">Înregistrare</Link>
              <Link href="/login" className="text-blue-600 hover:text-blue-700">Autentificare</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}