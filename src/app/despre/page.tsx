import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Despre | Swaply',
  description: 'Informații despre proiectul Swaply și obiectivele sale.',
};

export default function DesprePage() {
  return (
    <section className="mx-auto max-w-3xl leading-relaxed text-slate-800">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Despre Swaply</h1>
      <p className="mb-4">
        Swaply este o aplicație care te ajută să găsești parteneri potriviți pentru schimb de locuințe,
        fie pentru vacanțe, fie pe termen mediu. Încercăm să facem procesul simplu, sigur și transparent.
      </p>
      <h2 className="mt-8 mb-3 text-xl font-semibold">Misiunea noastră</h2>
      <p className="mb-4">
        Să conectăm oameni cu nevoi complementare într-un mod cât mai eficient
        și prietenos, oferind instrumentele potrivite pentru a descoperi, comunica și confirma un schimb.
      </p>
      <h2 className="mt-8 mb-3 text-xl font-semibold">De ce Swaply</h2>
      <ul className="mb-6 list-disc pl-5">
        <li>Economisești bani și timp</li>
        <li>Descoperi locuri noi printr-o experiență autentică</li>
        <li>Ai control total asupra preferințelor și perioadelor</li>
      </ul>
      <div className="mt-6 flex gap-4">
        <Link href="/signup" className="text-blue-600 hover:text-blue-700 underline">Creează un cont</Link>
        <Link href="/contact" className="text-slate-700 hover:text-slate-900 underline">Contactează-ne</Link>
      </div>
    </section>
  );
}
