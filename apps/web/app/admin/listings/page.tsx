'use client';

import { useState, useEffect, useCallback } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import InvestorNavbar from '@/components/InvestorNavbar';
import ListingCard from '@/components/ListingCard';
import { useAuth } from '@/context/AuthContext';
import { SECTORS, STAGES, ROUND_TYPES } from '@/lib/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Listing {
  id: string;
  roundType: string;
  targetAmountInr: string;
  instrument: string;
  investorCount: number;
  investorCap: number;
  startup: {
    name: string;
    slug: string;
    sector: string;
    stage: string;
    oneLiner: string;
    logoUrl: string | null;
    location: string | null;
  };
}

function ListingsContent() {
  const { token } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [sector, setSector] = useState('');
  const [stage, setStage] = useState('');
  const [roundType, setRoundType] = useState('');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const buildQuery = useCallback((cursor?: string) => {
    const params = new URLSearchParams();
    if (sector) params.set('sector', sector);
    if (stage) params.set('stage', stage);
    if (roundType) params.set('roundType', roundType);
    if (cursor) params.set('cursor', cursor);
    return params.toString();
  }, [sector, stage, roundType]);

  const fetchListings = useCallback(async (reset: boolean) => {
    const res = await fetch(`${API_URL}/listing/browse?${buildQuery()}`);
    if (res.ok) {
      const data = await res.json();
      setListings(data.items);
      setNextCursor(data.nextCursor);
    }
  }, [buildQuery]);

  useEffect(() => {
    setIsLoading(true);
    fetchListings(true).finally(() => setIsLoading(false));
  }, [fetchListings]);

  const loadMore = async () => {
    if (!nextCursor) return;
    setIsLoadingMore(true);
    try {
      const res = await fetch(`${API_URL}/listing/browse?${buildQuery(nextCursor)}`);
      if (res.ok) {
        const data = await res.json();
        setListings((prev) => [...prev, ...data.items]);
        setNextCursor(data.nextCursor);
      }
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <InvestorNavbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Browse Listings</h1>
        <p className="text-sm text-gray-500 mb-6">
          Private placement opportunities under the Companies Act, 2013. Sprezox is a technology platform, not an investment advisor.
        </p>

        <div className="flex flex-wrap gap-3 mb-6">
          <select
            value={sector}
            onChange={(e) => setSector(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All sectors</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All stages</option>
            {STAGES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={roundType}
            onChange={(e) => setRoundType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All round types</option>
            {ROUND_TYPES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400 text-sm py-10">Loading listings...</div>
        ) : listings.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-10">No listings match your filters.</div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-4">
              {listings.map((listing) => (
                <ListingCard key={listing.id} {...listing} />
              ))}
            </div>

            {nextCursor && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="bg-white border border-gray-200 rounded-lg px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {isLoadingMore ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function ListingsPage() {
  return (
    <ProtectedRoute allowedRoles={['INVESTOR']}>
      <ListingsContent />
    </ProtectedRoute>
  );
}