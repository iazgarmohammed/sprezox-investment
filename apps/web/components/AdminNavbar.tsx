'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/listings', label: 'Listings Queue' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/activity', label: 'Activity Log' },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-gray-900">Sprezox Admin</span>
          <div className="flex gap-4">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium ${
                  pathname === link.href ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <button onClick={logout} className="text-sm text-gray-500 hover:text-gray-900">
          Log out
        </button>
      </div>
    </nav>
  );
}