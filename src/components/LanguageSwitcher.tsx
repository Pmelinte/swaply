'use client';

import { useI18n } from '@/lib/i18n';

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(e.target.value as 'ro' | 'en');
  };

  return (
    <select
      value={locale}
      onChange={handleChange}
      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      aria-label="Select language"
    >
      <option value="ro">RO</option>
      <option value="en">EN</option>
    </select>
  );
}
