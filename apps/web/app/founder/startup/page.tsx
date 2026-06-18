'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { SECTORS, STAGES } from '@/lib/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface Startup {
  id: string;
  name: string;
  sector: string;
  stage: string;
  oneLiner: string;
  description: string | null;
  websiteUrl: string | null;
  location: string | null;
  teamSize: number | null;
  logoUrl: string | null;
}

function StartupForm() {
  const { token } = useAuth();

  const [name, setName] = useState('');
  const [sector, setSector] = useState<string>(SECTORS[0]);
  const [stage, setStage] = useState<string>(STAGES[0]);
  const [oneLiner, setOneLiner] = useState('');
  const [description, setDescription] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [location, setLocation] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStartup = async () => {
      try {
        const res = await fetch(`${API_URL}/startup/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: Startup | null = await res.json();
          if (data) {
            setName(data.name);
            setSector(data.sector);
            setStage(data.stage);
            setOneLiner(data.oneLiner);
            setDescription(data.description || '');
            setWebsiteUrl(data.websiteUrl || '');
            setLocation(data.location || '');
            setTeamSize(data.teamSize?.toString() || '');
            setLogoUrl(data.logoUrl);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchStartup();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const res = await fetch(`${API_URL}/startup/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          sector,
          stage,
          oneLiner,
          description: description || undefined,
          websiteUrl: websiteUrl || undefined,
          location: location || undefined,
          teamSize: teamSize ? Number(teamSize) : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(msg || 'Failed to save startup');
      }

      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);

        const logoRes = await fetch(`${API_URL}/startup/me/logo`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!logoRes.ok) {
          const logoData = await logoRes.json();
          throw new Error(logoData.message || 'Logo upload failed');
        }

        const logoData = await logoRes.json();
        setLogoUrl(logoData.logoUrl);
      }

      setMessage('Startup profile saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading startup...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Startup Profile</h1>
        <p className="text-sm text-gray-500 mb-6">This is what investors will see.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {logoUrl && (
            <img src={logoUrl} alt="Startup logo" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="w-full text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">PNG/JPEG/WEBP, max 2MB</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Startup name</label>
            <input
              type="text"
              required
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">One-liner (max 160 chars)</label>
            <input
              type="text"
              required
              maxLength={160}
              value={oneLiner}
              onChange={(e) => setOneLiner(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="What does your startup do, in one sentence?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
              <input
                type="url"
                maxLength={255}
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                maxLength={100}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g. Bengaluru"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team size</label>
            <input
              type="number"
              min={1}
              value={teamSize}
              onChange={(e) => setTeamSize(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-indigo-600 text-white rounded-lg py-2.5 text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save startup profile'}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function StartupProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['FOUNDER']}>
      <StartupForm />
    </ProtectedRoute>
  );
}