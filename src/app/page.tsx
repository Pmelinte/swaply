import Link from 'next/link';
import { BottomNav } from '@/components/layout/BottomNav';

export default function HomePage() {
  return (
    <div className="pb-20">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Swaply</h1>
        <p className="mt-2 text-lg text-gray-600">
          Mesaj de bun venit - Scopul site-ului
        </p>
      </div>

      <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
        <h2 className="text-xl font-semibold">Autentificare / Înregistrare</h2>
        <div className="mt-4 flex flex-col space-y-2">
          <Link href="/signup" className="rounded bg-blue-500 px-4 py-2 text-center text-white hover:bg-blue-600">
            Înregistrare
          </Link>
          <Link href="/login" className="rounded bg-green-500 px-4 py-2 text-center text-white hover:bg-green-600">
            Autentificare
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-lg bg-white p-6 shadow-md">
        <h2 className="text-xl font-semibold">Hartă</h2>
        <div className="mt-4 flex h-64 w-full items-center justify-center rounded bg-gray-200">
          <p className="text-gray-500">Aici va fi componenta Google Maps.</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}