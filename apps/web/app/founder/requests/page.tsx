'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import FounderNavbar from '@/components/FounderNavbar';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface DocumentRequestItem {
  id: string;
  status: string;
  requestedAt: string;
  resolvedAt: string | null;
  investor: {
    email: string;
    fullName: string | null;
    bio: string | null;
    linkedinUrl: string | null;
  };
}

const STATUS_COLORS: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Approved: 'bg-green-100 text-green-700',
  Declined: 'bg-gray-100 text-gray-500',
};

function RequestsContent() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<DocumentRequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await fetch(`${API_URL}/document-request/founder`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setRequests(await res.json());
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchRequests();
  }, [token]);

  const handleReview = async (id: string, decision: 'APPROVE' | 'DECLINE') => {
    setError('');
    setActionLoadingId(id);
    try {
      const res = await fetch(`${API_URL}/document-request/${id}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ decision }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update request');

      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: data.status, resolvedAt: data.resolvedAt } : r)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading requests...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <FounderNavbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Pitch Deck Requests</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2 mb-4">
            {error}
          </div>
        )}

        {requests.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-sm text-gray-500">
            No requests yet.
          </div>
        )}

        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900">{req.investor.fullName || req.investor.email}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[req.status] || 'bg-gray-100 text-gray-600'}`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400">{req.investor.email}</p>
                {req.investor.bio && <p className="text-sm text-gray-600 mt-2">{req.investor.bio}</p>}
                {req.investor.linkedinUrl && (
                  <a href={req.investor.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 font-medium">
                    LinkedIn →
                  </a>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Requested {new Date(req.requestedAt).toLocaleDateString('en-IN')}
                </p>
              </div>

              {req.status === 'Pending' && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleReview(req.id, 'APPROVE')}
                    disabled={actionLoadingId === req.id}
                    className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReview(req.id, 'DECLINE')}
                    disabled={actionLoadingId === req.id}
                    className="bg-gray-100 text-gray-700 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-gray-200 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function FounderRequestsPage() {
  return (
    <ProtectedRoute allowedRoles={['FOUNDER']}>
      <RequestsContent />
    </ProtectedRoute>
  );
}