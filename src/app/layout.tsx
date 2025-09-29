import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Swaply',
  description: 'Schimbă, nu cumpăra!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro">
      <body className="bg-gray-50 text-gray-900">
        <div className="container mx-auto max-w-lg p-4">{children}</div>
      </body>
    </html>
  );
}