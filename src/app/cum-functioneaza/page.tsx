import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cum funcționează | Swaply',
  description: 'Pașii simpli pentru a folosi Swaply.',
};

export default function CumFunctioneazaPage() {
  return (
    <section className="mx-auto max-w-3xl leading-relaxed text-slate-800">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Cum funcționează</h1>
      <ol className="mb-6 list-decimal pl-5 space-y-3">
        <li>Creezi un cont și îți completezi profilul (oraș, perioade, preferințe).</li>
        <li>Cauți parteneri compatibili folosind filtre simple.</li>
        <li>Trimiți sau primești propuneri de schimb.</li>
        <li>Discutați detaliile și confirmați schimbul.</li>
        <li>După schimb, lăsați feedback pentru a crește încrederea în comunitate.</li>
      </ol>
      <h2 className="mt-8 mb-3 text-xl font-semibold">Sfaturi utile</h2>
      <ul className="mb-4 list-disc pl-5">
        <li>Adaugă suficiente detalii și fotografii în profil.</li>
        <li>Comunică clar așteptările înainte de confirmare.</li>
        <li>Folosește mesajele din aplicație pentru a păstra istoricul discuțiilor.</li>
      </ul>
    </section>
  );
}