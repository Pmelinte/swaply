'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Acasă' },
  { href: '/profil', label: 'Profil' },
  { href: '/match', label: 'Match' },
  { href: '/chat', label: 'Chat' },
  { href: '/info', label: 'Info' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-gray-200 bg-white/80 shadow-t-md backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg justify-around p-2">
        {navItems.map((item) => {
          // Special logic for 'Acasă' to be active only on the exact path
          const isActive =
            item.href === '/'
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 rounded-md px-3 py-1 text-xs transition-colors ${
                isActive
                  ? 'font-bold text-blue-600'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {/* You can add icons here later */}
              <span>{item.label.toUpperCase()}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}