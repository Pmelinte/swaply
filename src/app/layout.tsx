import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
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
        {/* Banner temporar pentru verificare Tailwind — îl vom elimina după confirmare */}
        <div className="fixed inset-x-0 top-0 z-50 bg-emerald-600 text-white text-center py-2 text-sm">
          Tailwind OK — banner temporar (îl scoatem după ce confirmi)
        </div>
        <div className="pt-10">{children}</div>
      </body>
    </html>
  );
}