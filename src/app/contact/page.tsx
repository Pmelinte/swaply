import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact | Swaply',
  description: 'Contactează echipa Swaply.',
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-3xl leading-relaxed text-slate-800">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Contact</h1>
      <p className="mb-4">
        Ai întrebări sau feedback? Scrie-ne la{' '}
        <a href="mailto:contact@swaply.app" className="text-blue-600 hover:text-blue-700 underline">
          contact@swaply.app
        </a>
        .
      </p>
      <p className="mb-4">În curând vom adăuga și un formular de contact direct în aplicație.</p>
    </section>
  );
}