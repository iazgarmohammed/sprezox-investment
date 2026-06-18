'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminNavbar from '@/components/AdminNavbar';
import { useAuth } from '@/context/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface ActivityLogEntry {
  id: string;
  eventType: string;
  actorEmail: string;
  actorRole: string;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const EVENT_LABELS: Record<string, string> = {
  LISTING_SUBMITTED: 'Listing submitted',
  LISTING_APPROVED: 'Listing approved',
  LISTING_REJECTED: 'Listing rejected',
  DOCUMENT_REQUESTED: 'Document requested',
  DOCUMENT_APPROVED: 'Document request approved',
  DOCUMENT_DECLINED: 'Document request declined',
  CONNECTION_REQUESTED: 'Connection requested',
  CONNECTION_APPROVED: 'Connection request approved',
  CONNECTION_DECLINED: 'Connection request declined',
  USER_DEACTIVATED: 'User deactivated',
};

function ActivityContent() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${API_URL}/admin/activity-log`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setLogs(await res.json());
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchLogs();
  }, [token]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading activity log...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity Log</h1>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-500">
              <tr>
                <th className="px-4 py-3 font-medium">Event</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Target ID</th>
                <th className="px-4 py-3 font-medium">Details</th>
                <th className="px-4 py-3 font-medium">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">No activity yet.</td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{EVENT_LABELS[log.eventType] || log.eventType}</td>
                  <td className="px-4 py-3 text-gray-600">{log.actorEmail} <span className="text-gray-400">({log.actorRole})</span></td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{log.targetId ? log.targetId.slice(0, 8) + '…' : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {log.metadata ? JSON.stringify(log.metadata) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

export default function AdminActivityPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <ActivityContent />
    </ProtectedRoute>
  );
}