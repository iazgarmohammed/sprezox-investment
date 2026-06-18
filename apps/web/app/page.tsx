'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function HomePage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (token && user) {
      if (user.role === 'FOUNDER') router.push('/founder');
      else if (user.role === 'ADMIN') router.push('/admin');
      else if (user.role === 'INVESTOR') router.push('/listings');
    }
  }, [user, token, isLoading, router]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading...</div>;
  }

  if (token && user) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Redirecting...</div>;
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-3">Sprezox</h1>
      <p className="text-lg text-gray-600 max-w-md mb-8">
        India&apos;s private placement marketplace connecting founders and investors under the
        Companies Act, 2013.
      </p>

      <div className="flex gap-3">
        <Link
          href="/signup"
          className="bg-indigo-600 text-white rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-indigo-700 transition"
        >
          Get started
        </Link>
        <Link
          href="/login"
          className="bg-white border border-gray-200 text-gray-700 rounded-lg px-6 py-2.5 text-sm font-semibold hover:bg-gray-50 transition"
        >
          Log in
        </Link>
      </div>
    </main>
  );
}