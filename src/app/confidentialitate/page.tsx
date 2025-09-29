import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Confidențialitate | Swaply',
  description: 'Informații despre protecția datelor personale pe Swaply.',
};

export default function ConfidentialitatePage() {
  return (
    <section className="mx-auto max-w-3xl leading-relaxed text-slate-800">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Politica de confidențialitate</h1>
      <p className="mb-4">
        Respectăm confidențialitatea datelor tale. Colectăm minimum de informații necesare pentru
        funcționarea serviciului (ex: e-mail pentru autentificare).
      </p>
      <h2 className="mt-8 mb-3 text-xl font-semibold">Date colectate</h2>
      <ul className="mb-4 list-disc pl-5">
        <li>Adresa de e-mail</li>
        <li>Date de profil pe care alegi să le partajezi</li>
        <li>Date tehnice anonime (ex: analytics agregat)</li>
      </ul>
      <p className="mb-4">Vom publica versiunea completă a politicii odată cu lansarea publică.</p>
    </section>
  );
}
