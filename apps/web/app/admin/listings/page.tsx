'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminNavbar from '@/components/AdminNavbar';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface PendingListing {
  id: string;
  roundType: string;
  targetAmountInr: string;
  instrument: string;
  useOfFunds: string | null;
  tractionHighlights: string[] | null;
  submittedAt: string | null;
  startup: {
    name: string;
    sector: string;
    stage: string;
    oneLiner: string;
  };
}

function ListingsQueueContent() {
  const { token } = useAuth();
  const [listings, setListings] = useState<PendingListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deckUrls, setDeckUrls] = useState<Record<string, string>>({});
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchListings = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/listings/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setListings(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchListings();
  }, [token]);

  const loadDeck = async (listingId: string) => {
    try {
      const res = await fetch(`${API_URL}/admin/listings/${listingId}/deck-url`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDeckUrls((prev) => ({ ...prev, [listingId]: data.signedUrl }));
      }
    } catch {
      // ignore
    }
  };

  const handleApprove = async (id: string) => {
    setError('');
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API_URL}/admin/listings/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision: 'APPROVE' }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to approve listing');

      setListings((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      setError('A rejection reason is required');
      return;
    }

    setError('');
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API_URL}/admin/listings/${id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision: 'REJECT', adminNote: rejectReason }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to reject listing');

      setListings((prev) => prev.filter((l) => l.id !== id));
      setRejectingId(null);
      setRejectReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading queue...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Listings Queue</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        {listings.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-sm text-gray-500">
            No pending listings.
          </div>
        )}

        {listings.map((listing) => (
          <div key={listing.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{listing.startup.name}</h2>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700">
                {listing.startup.sector} · {listing.startup.stage}
              </span>
            </div>

            <p className="text-sm text-gray-600">{listing.startup.oneLiner}</p>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-400">Round</p>
                <p className="font-medium text-gray-900">{listing.roundType} · {listing.instrument}</p>
              </div>
              <div>
                <p className="text-gray-400">Target amount</p>
                <p className="font-medium text-gray-900">₹{Number(listing.targetAmountInr).toLocaleString('en-IN')}</p>
              </div>
            </div>

            {listing.useOfFunds && (
              <div>
                <p className="text-gray-400 text-sm">Use of funds</p>
                <p className="text-sm text-gray-700">{listing.useOfFunds}</p>
              </div>
            )}

            {listing.tractionHighlights && listing.tractionHighlights.length > 0 && (
              <div>
                <p className="text-gray-400 text-sm">Traction</p>
                <ul className="list-disc list-inside text-sm text-gray-700">
                  {listing.tractionHighlights.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              {deckUrls[listing.id] ? (
                <iframe
                  src={deckUrls[listing.id]}
                  className="w-full h-96 border border-gray-200 rounded-lg"
                  title="Pitch deck preview"
                />
              ) : (
                <button
                  onClick={() => loadDeck(listing.id)}
                  className="text-sm text-indigo-600 font-medium"
                >
                  Load pitch deck preview →
                </button>
              )}
            </div>

            {rejectingId === listing.id ? (
              <div className="space-y-2">
                <textarea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (visible to founder)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(listing.id)}
                    disabled={actionLoadingId === listing.id}
                    className="bg-red-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoadingId === listing.id ? 'Rejecting...' : 'Confirm reject'}
                  </button>
                  <button
                    onClick={() => { setRejectingId(null); setRejectReason(''); }}
                    className="text-sm text-gray-500"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(listing.id)}
                  disabled={actionLoadingId === listing.id}
                  className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {actionLoadingId === listing.id ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => setRejectingId(listing.id)}
                  className="bg-gray-100 text-gray-700 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-200"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}

export default function AdminListingsPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <ListingsQueueContent />
    </ProtectedRoute>
  );
}