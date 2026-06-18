'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import InvestorNavbar from '@/components/InvestorNavbar';
import PdfViewer from '@/components/PdfViewer';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

function DeckViewerContent() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.id as string;
  const { token } = useAuth();

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDeck = async () => {
      try {
        const reqRes = await fetch(`${API_URL}/document-request/mine/for-listing?listingId=${listingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!reqRes.ok) {
          setError('Could not find your access request for this listing.');
          return;
        }

        const reqData = await reqRes.json();

        if (!reqData || reqData.status !== 'Approved') {
          setError('Your request for this pitch deck has not been approved yet.');
          return;
        }

        const deckRes = await fetch(`${API_URL}/document-request/${reqData.id}/deck-url`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const deckData = await deckRes.json();

        if (!deckRes.ok) {
          setError(deckData.message || 'Could not load the pitch deck.');
          return;
        }

        setSignedUrl(deckData.signedUrl);
      } finally {
        setIsLoading(false);
      }
    };

    if (token) loadDeck();
  }, [listingId, token]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading deck access...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <InvestorNavbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <button
          onClick={() => router.push(`/listings/${listingId}`)}
          className="text-sm text-indigo-600 font-medium mb-4"
        >
          ← Back to listing
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Pitch Deck</h1>
          <p className="text-xs text-gray-400 mb-4">
            This deck is view-only. Downloading, printing, or redistribution is not permitted.
          </p>

          {error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          ) : signedUrl ? (
            <PdfViewer fileUrl={signedUrl} />
          ) : null}
        </div>
      </div>
    </main>
  );
}

export default function DeckViewerPage() {
  return (
    <ProtectedRoute allowedRoles={['INVESTOR']}>
      <DeckViewerContent />
    </ProtectedRoute>
  );
}