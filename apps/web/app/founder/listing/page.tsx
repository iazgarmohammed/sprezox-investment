'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { ROUND_TYPES, INSTRUMENTS } from '@/lib/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Listing {
  id: string;
  roundType: string;
  targetAmountInr: string;
  instrument: string;
  useOfFunds: string | null;
  tractionHighlights: string[] | null;
  status: string;
  pitchDeckUrl: string | null;
}

function ListingForm() {
  const { token } = useAuth();

  const [roundType, setRoundType] = useState<string>(ROUND_TYPES[0]);
  const [targetAmountInr, setTargetAmountInr] = useState('');
  const [instrument, setInstrument] = useState<string>(INSTRUMENTS[0]);
  const [useOfFunds, setUseOfFunds] = useState('');
  const [tractionText, setTractionText] = useState('');
  const [status, setStatus] = useState('Draft');
  const [pitchDeckUrl, setPitchDeckUrl] = useState<string | null>(null);
  const [deckFile, setDeckFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await fetch(`${API_URL}/listing/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: Listing | null = await res.json();
          if (data) {
            setRoundType(data.roundType);
            setTargetAmountInr(data.targetAmountInr.toString());
            setInstrument(data.instrument);
            setUseOfFunds(data.useOfFunds || '');
            setTractionText((data.tractionHighlights || []).join('\n'));
            setStatus(data.status);
            setPitchDeckUrl(data.pitchDeckUrl);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchListing();
  }, [token]);

  const isLocked = status !== 'Draft';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const tractionHighlights = tractionText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      const res = await fetch(`${API_URL}/listing/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roundType,
          targetAmountInr: Number(targetAmountInr),
          instrument,
          useOfFunds: useOfFunds || undefined,
          tractionHighlights,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(msg || 'Failed to save listing');
      }

      setStatus(data.status);

      if (deckFile) {
        const formData = new FormData();
        formData.append('file', deckFile);

        const deckRes = await fetch(`${API_URL}/listing/me/pitch-deck`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!deckRes.ok) {
          const deckData = await deckRes.json();
          throw new Error(deckData.message || 'Pitch deck upload failed');
        }

        const deckData = await deckRes.json();
        setPitchDeckUrl(deckData.pitchDeckUrl);
      }

      setMessage('Listing saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitForReview = async () => {
    setError('');
    setMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`${API_URL}/listing/me/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(msg || 'Failed to submit listing');
      }

      setStatus(data.status);
      setMessage('Listing submitted for review. An admin will review it shortly.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading listing...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-gray-900">Fundraising Listing</h1>
          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-gray-100 text-gray-600">{status}</span>
        </div>
        <p className="text-sm text-gray-500 mb-6">This is what investors will evaluate.</p>

        {isLocked && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-3 py-2 mb-4">
            This listing has been submitted and can no longer be edited here.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Round type</label>
              <select
                disabled={isLocked}
                value={roundType}
                onChange={(e) => setRoundType(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                {ROUND_TYPES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Instrument</label>
              <select
                disabled={isLocked}
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              >
                {INSTRUMENTS.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target amount (INR)</label>
            <input
              type="number"
              required
              min={100000}
              disabled={isLocked}
              value={targetAmountInr}
              onChange={(e) => setTargetAmountInr(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              placeholder="e.g. 5000000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Use of funds</label>
            <textarea
              rows={3}
              disabled={isLocked}
              value={useOfFunds}
              onChange={(e) => setUseOfFunds(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Traction highlights (one per line)</label>
            <textarea
              rows={4}
              disabled={isLocked}
              value={tractionText}
              onChange={(e) => setTractionText(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100"
              placeholder={'e.g.\n10,000 MAU\n₹2L MRR\n3 enterprise pilots'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pitch deck (PDF, max 10MB)</label>
            {pitchDeckUrl && (
              <p className="text-xs text-green-600 mb-1">A pitch deck has been uploaded.</p>
            )}
            {!isLocked && (
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setDeckFile(e.target.files?.[0] || null)}
                className="w-full text-sm"
              />
            )}
          </div>

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-3 py-2">
              {message}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {!isLocked && (
            <button
              type="submit"
              disabled={isSaving}
              className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save draft'}
            </button>
          )}
        </form>

        {!isLocked && (
          <button
            type="button"
            onClick={handleSubmitForReview}
            disabled={isSubmitting || !pitchDeckUrl}
            className="w-full mt-3 bg-gray-900 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-black transition disabled:opacity-50"
            title={!pitchDeckUrl ? 'Upload a pitch deck first' : undefined}
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        )}
      </div>
    </main>
  );
}

export default function ListingPage() {
  return (
    <ProtectedRoute allowedRoles={['FOUNDER']}>
      <ListingForm />
    </ProtectedRoute>
  );
}