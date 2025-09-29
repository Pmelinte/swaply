import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Termeni și condiții | Swaply',
  description: 'Termenii de utilizare ai serviciului Swaply.',
};

export default function TermeniPage() {
  return (
    <section className="mx-auto max-w-3xl leading-relaxed text-slate-800">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Termeni și condiții</h1>
      <p className="mb-4">
        Acesta este un rezumat informativ. Versiunea integrală a termenilor va fi publicată în curând.
      </p>
      <h2 className="mt-8 mb-3 text-xl font-semibold">Utilizarea serviciului</h2>
      <p className="mb-4">
        Te angajezi să furnizezi informații corecte și să respecți regulile comunității.
      </p>
      <h2 className="mt-8 mb-3 text-xl font-semibold">Răspundere</h2>
      <p className="mb-4">
        Swaply facilitează contactul dintre utilizatori; acordurile concrete se stabilesc între părți.
      </p>
    </section>
  );
}