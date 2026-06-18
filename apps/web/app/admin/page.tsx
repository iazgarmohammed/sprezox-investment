'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminNavbar from '@/components/AdminNavbar';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface DashboardCounts {
  totalUsers: number;
  totalFounders: number;
  totalInvestors: number;
  totalStartups: number;
  pendingListings: number;
  liveListings: number;
}

function AdminDashboardContent() {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/dashboard`, {
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

  const cards = [
    { label: 'Total Users', value: data?.totalUsers },
    { label: 'Founders', value: data?.totalFounders },
    { label: 'Investors', value: data?.totalInvestors },
    { label: 'Startups', value: data?.totalStartups },
    { label: 'Pending Listings', value: data?.pendingListings },
    { label: 'Live Listings', value: data?.liveListings },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-3 gap-4">
          {cards.map((card) => (
            <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-gray-400 mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value ?? 0}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}