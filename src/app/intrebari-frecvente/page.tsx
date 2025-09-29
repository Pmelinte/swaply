import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Întrebări frecvente | Swaply',
  description: 'FAQ pentru utilizatorii Swaply.',
};

export default function IntrebariFrecventePage() {
  return (
    <section className="mx-auto max-w-3xl leading-relaxed text-slate-800">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Întrebări frecvente</h1>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Este Swaply gratuit?</h2>
      <p className="mb-4">În faza inițială, da. Anumite funcții avansate pot deveni premium pe viitor.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Este sigur?</h2>
      <p className="mb-4">
        Folosim autentificare prin e-mail și verificări de bază. Urmează sistem de reputație și review-uri.
      </p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Pot anula un schimb?</h2>
      <p className="mb-4">Da, înainte de confirmare. După confirmare, urmează regulile agreate cu partenerul.</p>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Cum contactez suportul?</h2>
      <p className="mb-4">Trimite-ne un mesaj din pagina <a className="text-blue-600 hover:text-blue-700 underline" href="/contact">Contact</a>.</p>
    </section>
  );
}