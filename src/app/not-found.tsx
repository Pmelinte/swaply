'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';

function NotFoundContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') || 'Pagina nu a fost găsită.';
  const details = searchParams.get('details');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center px-4">
      <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-2">{message}</h2>
      {details && <p className="text-gray-600 mb-6">{details}</p>}
      <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
        Înapoi la pagina principală
      </Link>
    </div>
  );
}

export default function NotFoundPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <NotFoundContent />
        </Suspense>
    )
}
