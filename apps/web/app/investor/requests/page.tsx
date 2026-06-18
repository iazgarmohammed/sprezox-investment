'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import InvestorNavbar from '@/components/InvestorNavbar';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface BaseRequest {
  id: string;
  status: string;
  requestedAt: string;
  resolvedAt: string | null;
  listing: {
    id: string;
    roundType: string;
    startup: { name: string; logoUrl: string | null };
  };
}

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-green-700',
  Declined: 'bg-gray-100 text-gray-500',
};

function RequestRow({ req, type }: { req: BaseRequest; type: 'Pitch Deck' | 'Connection' }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {req.listing.startup.logoUrl ? (
          <img src={req.listing.startup.logoUrl} alt={req.listing.startup.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
            {req.listing.startup.name.charAt(0)}
          </div>
        )}
        <div>
          <p className="font-medium text-gray-900">{req.listing.startup.name}</p>
          <p className="text-xs text-gray-400">{type} request · {req.listing.roundType}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-600'}`}>
          {req.status}
        </span>
        {type === 'Pitch Deck' && req.status === 'Approved' ? (
          <Link href={`/listings/${req.listing.id}/deck`} className="text-xs text-indigo-600 font-medium">
            View deck →
          </Link>
        ) : (
          <Link href={`/listings/${req.listing.id}`} className="text-xs text-indigo-600 font-medium">
            View listing →
          </Link>
        )}
      </div>
    </div>
  );
}

function RequestsContent() {
  const { token } = useAuth();
  const [docRequests, setDocRequests] = useState<BaseRequest[]>([]);
  const [connRequests, setConnRequests] = useState<BaseRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'declined'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [docRes, connRes] = await Promise.all([
          fetch(`${API_URL}/document-request/mine`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_URL}/connection-request/mine`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (docRes.ok) setDocRequests(await docRes.json());
        if (connRes.ok) setConnRequests(await connRes.json());
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchAll();
  }, [token]);

  const filterByStatus = (req: BaseRequest) => {
    if (filter === 'all') return true;
    return req.status.toLowerCase() === filter;
  };

  const filteredDocs = docRequests.filter(filterByStatus);
  const filteredConns = connRequests.filter(filterByStatus);

  const combined = [
    ...filteredDocs.map((r) => ({ req: r, type: 'Pitch Deck' as const })),
    ...filteredConns.map((r) => ({ req: r, type: 'Connection' as const })),
  ].sort((a, b) => new Date(b.req.requestedAt).getTime() - new Date(a.req.requestedAt).getTime());

  const filters: { key: typeof filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'declined', label: 'Declined' },
  ];

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading requests...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <InvestorNavbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Requests</h1>
        <p className="text-sm text-gray-500 mb-6">Track your pitch deck and connection requests across all listings.</p>

        <div className="flex gap-2 mb-6">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg ${
                filter === f.key ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {combined.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-sm text-gray-500">
            No requests {filter !== 'all' ? `with status "${filter}"` : 'yet'}. Browse listings to get started.
          </div>
        ) : (
          <div className="space-y-3">
            {combined.map(({ req, type }) => (
              <RequestRow key={`${type}-${req.id}`} req={req} type={type} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function InvestorRequestsPage() {
  return (
    <ProtectedRoute allowedRoles={['INVESTOR']}>
      <RequestsContent />
    </ProtectedRoute>
  );
}