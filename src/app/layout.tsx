import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'Swaply - Schimbă, nu cumpăra',
  description: 'Comunitate globală de schimburi inteligente. Redescoperă valoarea obiectelor tale și găsește exact ce îți trebuie prin schimb.',
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 antialiased font-sans" suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}