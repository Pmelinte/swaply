import type { Metadata } from 'next';
import './globals.css';
import { ClientLayout } from '@/components/ClientLayout';

export const metadata: Metadata = {
  title: 'Swaply',
  description: 'Găsește partenerul potrivit pentru schimb de locuințe.',
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