'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import FounderNavbar from '@/components/FounderNavbar';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface RequestCounts {
  pending: number;
  approved: number;
  declined: number;
}

interface Dashboard {
  hasStartup: boolean;
  listing: {
    id: string;
    roundType: string;
    targetAmountInr: string;
    instrument: string;
    status: string;
    investorCount: number;
    investorCap: number;
    submittedAt: string | null;
    publishedAt: string | null;
    adminNote: string | null;
  } | null;
  documentRequestCounts: RequestCounts;
  connectionRequestCounts: RequestCounts;
}

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Pending: 'bg-amber-100 text-amber-700',
  Live: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Closed: 'bg-gray-200 text-gray-500',
};

function DashboardContent() {
  const { token } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API_URL}/listing/me/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setData(await res.json());
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchDashboard();
  }, [token]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading dashboard...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <FounderNavbar />
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Founder Dashboard</h1>

        {!data?.hasStartup && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-600 mb-3">
              You haven&apos;t created your startup profile yet.
            </p>
            <Link href="/founder/startup" className="inline-block bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-indigo-700">
              Create startup profile
            </Link>
          </div>
        )}

        {data?.hasStartup && !data.listing && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-sm text-gray-600 mb-3">
              You haven&apos;t created a fundraising listing yet.
            </p>
            <Link href="/founder/listing" className="inline-block bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-indigo-700">
              Create listing
            </Link>
          </div>
        )}

        {data?.listing && (
          <>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Listing Status</h2>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[data.listing.status] || 'bg-gray-100 text-gray-600'}`}>
                  {data.listing.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Round type</p>
                  <p className="font-medium text-gray-900">{data.listing.roundType}</p>
                </div>
                <div>
                  <p className="text-gray-400">Instrument</p>
                  <p className="font-medium text-gray-900">{data.listing.instrument}</p>
                </div>
                <div>
                  <p className="text-gray-400">Target amount</p>
                  <p className="font-medium text-gray-900">₹{Number(data.listing.targetAmountInr).toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-gray-400">Investor cap usage</p>
                  <p className="font-medium text-gray-900">{data.listing.investorCount} / {data.listing.investorCap}</p>
                </div>
              </div>

              {data.listing.status === 'Rejected' && data.listing.adminNote && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  <strong>Rejection reason:</strong> {data.listing.adminNote}
                </div>
              )}

              <Link href="/founder/listing" className="inline-block mt-4 text-sm text-indigo-600 font-medium">
                {data.listing.status === 'Draft' ? 'Continue editing →' : 'View listing →'}
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Document Requests</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Pending: <span className="font-semibold text-amber-600">{data.documentRequestCounts.pending}</span></p>
                  <p>Approved: <span className="font-semibold text-green-600">{data.documentRequestCounts.approved}</span></p>
                  <p>Declined: <span className="font-semibold text-gray-500">{data.documentRequestCounts.declined}</span></p>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Connection Requests</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Pending: <span className="font-semibold text-amber-600">{data.connectionRequestCounts.pending}</span></p>
                  <p>Approved: <span className="font-semibold text-green-600">{data.connectionRequestCounts.approved}</span></p>
                  <p>Declined: <span className="font-semibold text-gray-500">{data.connectionRequestCounts.declined}</span></p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default function FounderDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['FOUNDER']}>
      <DashboardContent />
    </ProtectedRoute>
  );
}