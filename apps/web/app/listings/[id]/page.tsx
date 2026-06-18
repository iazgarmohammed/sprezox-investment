'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import InvestorNavbar from '@/components/InvestorNavbar';
import DisclaimerBanner from '@/components/DisclaimerBanner';
import DisclaimerModal from '@/components/DisclaimerModal';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface ListingDetail {
  id: string;
  roundType: string;
  targetAmountInr: string;
  instrument: string;
  useOfFunds: string | null;
  tractionHighlights: string[] | null;
  investorCount: number;
  investorCap: number;
  publishedAt: string | null;
  startup: {
    id: string;
    name: string;
    slug: string;
    sector: string;
    stage: string;
    oneLiner: string;
    description: string | null;
    logoUrl: string | null;
    websiteUrl: string | null;
    location: string | null;
    teamSize: number | null;
  };
}

interface RequestStatus {
  id: string;
  status: string;
}

function ListingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { token } = useAuth();

  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [docRequest, setDocRequest] = useState<RequestStatus | null>(null);
  const [connRequest, setConnRequest] = useState<RequestStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isRequestingDeck, setIsRequestingDeck] = useState(false);
  const [isRequestingConn, setIsRequestingConn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch(`${API_URL}/listing/browse/${id}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (res.ok) {
          setListing(await res.json());
        }

        const [docRes, connRes] = await Promise.all([
          fetch(`${API_URL}/document-request/mine/for-listing?listingId=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_URL}/connection-request/mine/for-listing?listingId=${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (docRes.ok) setDocRequest(await docRes.json());
        if (connRes.ok) setConnRequest(await connRes.json());
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchAll();
  }, [id, token]);

  const handleRequestDeck = async () => {
    setError('');
    setIsRequestingDeck(true);

    try {
      const res = await fetch(`${API_URL}/document-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ listingId: id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to request pitch deck');

      setDocRequest(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsRequestingDeck(false);
    }
  };

  const handleConfirmConnection = async (introNote: string) => {
    setError('');
    setIsRequestingConn(true);

    try {
      const res = await fetch(`${API_URL}/connection-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          listingId: id,
          disclaimerAccepted: true,
          introNote: introNote || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to request connection');

      setConnRequest(data);
      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsRequestingConn(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading listing...</div>;
  }

  if (notFound || !listing) {
    return (
      <main className="min-h-screen bg-gray-50">
        <InvestorNavbar />
        <div className="max-w-3xl mx-auto px-4 py-10 text-center text-gray-400 text-sm">
          This listing is not available.
        </div>
      </main>
    );
  }

  const capPercent = Math.min(100, Math.round((listing.investorCount / listing.investorCap) * 100));
  const capReached = listing.investorCount >= listing.investorCap;

  const handleDeckButtonClick = () => {
    if (!docRequest) {
      handleRequestDeck();
    } else if (docRequest.status === 'Approved') {
      router.push(`/listings/${id}/deck`);
    }
  };

  const deckButtonLabel = () => {
    if (!docRequest) return 'Request Pitch Deck';
    if (docRequest.status === 'Pending') return 'Request Pending';
    if (docRequest.status === 'Approved') return 'View Pitch Deck →';
    return 'Request Declined';
  };

  const deckButtonDisabled =
    capReached || isRequestingDeck || (!!docRequest && docRequest.status !== 'Approved');

  const connButtonLabel = () => {
    if (!connRequest) return 'Request Connection';
    if (connRequest.status === 'Pending') return 'Connection Pending';
    if (connRequest.status === 'Approved') return 'Connection Approved ✓';
    return 'Connection Declined';
  };

  const connButtonDisabled = capReached || isRequestingConn || !!connRequest;

  return (
    <main className="min-h-screen bg-gray-50">
      <InvestorNavbar />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-4">
        <DisclaimerBanner />

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-start gap-4 mb-4">
            {listing.startup.logoUrl ? (
              <img src={listing.startup.logoUrl} alt={listing.startup.name} className="w-14 h-14 rounded-xl object-cover border border-gray-100" />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl">
                {listing.startup.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{listing.startup.name}</h1>
              <p className="text-sm text-gray-500">{listing.startup.oneLiner}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{listing.startup.sector}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{listing.startup.stage}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{listing.roundType}</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{listing.instrument}</span>
          </div>

          {listing.startup.description && (
            <p className="text-sm text-gray-700 mb-4">{listing.startup.description}</p>
          )}

          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <p className="text-gray-400">Location</p>
              <p className="font-medium text-gray-900">{listing.startup.location || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400">Team size</p>
              <p className="font-medium text-gray-900">{listing.startup.teamSize || '—'}</p>
            </div>
            <div>
              <p className="text-gray-400">Website</p>
              {listing.startup.websiteUrl ? (
                <a href={listing.startup.websiteUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600">
                  Visit →
                </a>
              ) : (
                <p className="font-medium text-gray-900">—</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 mb-4">
            <p className="text-gray-400 text-sm mb-1">Target amount</p>
            <p className="text-2xl font-bold text-gray-900">₹{Number(listing.targetAmountInr).toLocaleString('en-IN')}</p>
          </div>

          {listing.useOfFunds && (
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-1">Use of funds</p>
              <p className="text-sm text-gray-700">{listing.useOfFunds}</p>
            </div>
          )}

          {listing.tractionHighlights && listing.tractionHighlights.length > 0 && (
            <div className="mb-4">
              <p className="text-gray-400 text-sm mb-1">Traction</p>
              <ul className="list-disc list-inside text-sm text-gray-700">
                {listing.tractionHighlights.map((t, i) => (
                  <li key={i}>{t}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-500">Investor slots</p>
              <p className="text-sm font-medium text-gray-900">{listing.investorCount} / {listing.investorCap}</p>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${capPercent}%` }} />
            </div>
            {capReached && (
              <p className="text-xs text-red-600 mt-1">This listing has reached its investor cap.</p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mt-4">
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleDeckButtonClick}
              disabled={deckButtonDisabled}
              className="flex-1 bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRequestingDeck ? 'Requesting...' : deckButtonLabel()}
            </button>
            <button
              onClick={() => setShowModal(true)}
              disabled={connButtonDisabled}
              className="flex-1 bg-gray-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connButtonLabel()}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <DisclaimerModal
          onConfirm={handleConfirmConnection}
          onCancel={() => setShowModal(false)}
          isSubmitting={isRequestingConn}
        />
      )}
    </main>
  );
}

export default function ListingDetailPage() {
  return (
    <ProtectedRoute allowedRoles={['INVESTOR']}>
      <ListingDetailContent />
    </ProtectedRoute>
  );
}