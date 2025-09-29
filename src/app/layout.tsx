import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css'; // <-- ACEASTA ESTE LINIA CRITICĂ

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
      <body className={inter.className}>{children}</body>
    </html>
  );
}