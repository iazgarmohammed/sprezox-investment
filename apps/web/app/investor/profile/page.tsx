'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import InvestorNavbar from '@/components/InvestorNavbar';
import { useAuth } from '@/context/AuthContext';
import { SECTORS, STAGES } from '@/lib/constants';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

interface InvestorProfile {
  fullName: string;
  bio: string | null;
  investmentThesis: string | null;
  minChequeSizeInr: string | null;
  maxChequeSizeInr: string | null;
  sectors: string[];
  stages: string[];
  linkedinUrl: string | null;
}

function InvestorProfileForm() {
  const { token } = useAuth();

  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [investmentThesis, setInvestmentThesis] = useState('');
  const [minChequeSizeInr, setMinChequeSizeInr] = useState('');
  const [maxChequeSizeInr, setMaxChequeSizeInr] = useState('');
  const [sectors, setSectors] = useState<string[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [linkedinUrl, setLinkedinUrl] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/investor-profile/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data: InvestorProfile | null = await res.json();
          if (data) {
            setFullName(data.fullName || '');
            setBio(data.bio || '');
            setInvestmentThesis(data.investmentThesis || '');
            setMinChequeSizeInr(data.minChequeSizeInr || '');
            setMaxChequeSizeInr(data.maxChequeSizeInr || '');
            setSectors(data.sectors || []);
            setStages(data.stages || []);
            setLinkedinUrl(data.linkedinUrl || '');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (token) fetchProfile();
  }, [token]);

  const toggleSector = (sector: string) => {
    setSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector],
    );
  };

  const toggleStage = (stage: string) => {
    setStages((prev) =>
      prev.includes(stage) ? prev.filter((s) => s !== stage) : [...prev, stage],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSaving(true);

    try {
      const res = await fetch(`${API_URL}/investor-profile/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fullName,
          bio: bio || undefined,
          investmentThesis: investmentThesis || undefined,
          minChequeSizeInr: minChequeSizeInr ? Number(minChequeSizeInr) : undefined,
          maxChequeSizeInr: maxChequeSizeInr ? Number(maxChequeSizeInr) : undefined,
          sectors,
          stages,
          linkedinUrl: linkedinUrl || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(msg || 'Failed to save profile');
      }

      setMessage('Profile saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400 text-sm">Loading profile...</div>;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <InvestorNavbar />
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Investor Profile</h1>
          <p className="text-sm text-gray-500 mb-6">Founders will see this when you make a request.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
              <input
                type="text"
                required
                maxLength={100}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Investment thesis</label>
              <textarea
                rows={3}
                value={investmentThesis}
                onChange={(e) => setInvestmentThesis(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="What kind of startups do you look for?"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min cheque size (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={minChequeSizeInr}
                  onChange={(e) => setMinChequeSizeInr(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max cheque size (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={maxChequeSizeInr}
                  onChange={(e) => setMaxChequeSizeInr(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sectors of interest</label>
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSector(s)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                      sectors.includes(s)
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stages of interest</label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStage(s)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full border ${
                      stages.includes(s)
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
              <input
                type="url"
                maxLength={255}
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
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
              {isSaving ? 'Saving...' : 'Save profile'}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function InvestorProfilePage() {
  return (
    <ProtectedRoute allowedRoles={['INVESTOR']}>
      <InvestorProfileForm />
    </ProtectedRoute>
  );
}