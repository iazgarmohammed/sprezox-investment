import Link from 'next/link';

interface ListingCardProps {
  id: string;
  roundType: string;
  targetAmountInr: string;
  instrument: string;
  investorCount: number;
  investorCap: number;
  startup: {
    name: string;
    slug: string;
    sector: string;
    stage: string;
    oneLiner: string;
    logoUrl: string | null;
    location: string | null;
  };
}

export default function ListingCard({
  id,
  roundType,
  targetAmountInr,
  instrument,
  investorCount,
  investorCap,
  startup,
}: ListingCardProps) {
  const capPercent = Math.min(100, Math.round((investorCount / investorCap) * 100));

  return (
    <Link
      href={`/listings/${id}`}
      className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition"
    >
      <div className="flex items-start gap-3 mb-3">
        {startup.logoUrl ? (
          <img src={startup.logoUrl} alt={startup.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
            {startup.name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{startup.name}</h3>
          <p className="text-xs text-gray-400">{startup.location || '—'}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{startup.oneLiner}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{startup.sector}</span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{startup.stage}</span>
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{roundType}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-900">₹{Number(targetAmountInr).toLocaleString('en-IN')}</span>
        <span className="text-xs text-gray-400">{instrument}</span>
      </div>

      <div className="mt-2">
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${capPercent}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">{investorCount} / {investorCap} investor slots</p>
      </div>
    </Link>
  );
}