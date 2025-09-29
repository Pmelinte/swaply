import Link from 'next/link';

export default function InfoIndexPage() {
  const links = [
    { href: '/info/despre', label: 'Despre' },
    { href: '/info/cum-functioneaza', label: 'Cum funcționează' },
    { href: '/info/intrebari-frecvente', label: 'Întrebări frecvente' },
    { href: '/info/termeni', label: 'Termeni și condiții' },
    { href: '/info/confidentialitate', label: 'Confidențialitate' },
    { href: '/info/contact', label: 'Contact' },
  ];
  return (
    <div className="mx-auto max-w-3xl leading-relaxed text-slate-800">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">Informații</h1>
      <ul className="grid gap-3">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-blue-600 hover:text-blue-700 underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}