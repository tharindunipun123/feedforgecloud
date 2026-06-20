'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Input, Card, PageHeader, LoadingSpinner } from '@/components/ui';

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'CNAME', 'NS'];

function DnsLookupContent() {
  const searchParams = useSearchParams();
  const [domain, setDomain] = useState('');
  const [recordType, setRecordType] = useState('A');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = searchParams.get('domain');
    if (q) setDomain(q);
  }, [searchParams]);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!domain.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);

    try {
      const res = await fetch(
        `/api/tools/dns?domain=${encodeURIComponent(domain.trim())}&type=${recordType}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lookup failed');
      setResults(data);
    } catch (err) {
      setError(err.message || 'Lookup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader title="DNS Lookup" description="Look up DNS records for any domain using live public DNS data." />
        <Card>
          <form onSubmit={handleLookup} className="space-y-4">
            <Input label="Domain name" placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Record type</label>
              <div className="flex flex-wrap gap-2">
                {RECORD_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setRecordType(type)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      recordType === type ? 'bg-white text-black border-white' : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <Button type="submit" disabled={loading || !domain.trim()}>
              {loading ? 'Looking up...' : 'Lookup DNS'}
            </Button>
          </form>
        </Card>

        {loading && (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        )}

        {error && <p className="mt-6 text-red-400 text-sm">{error}</p>}

        {results && !loading && (
          <Card className="mt-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Results for {results.domain} ({results.type})
            </h2>
            {results.records.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-800 text-neutral-400 text-left">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">TTL</th>
                      <th className="py-2">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.records.map((r, i) => (
                      <tr key={i} className="border-b border-neutral-800">
                        <td className="py-2 pr-4 text-white">{r.name}</td>
                        <td className="py-2 pr-4 text-neutral-400">{r.type}</td>
                        <td className="py-2 pr-4 text-neutral-500">{r.ttl}</td>
                        <td className="py-2 text-neutral-300 break-all">{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-neutral-400 text-sm">
                No {results.type} records found for this domain.
                {results.authority?.length ? ` Authority: ${results.authority.join(', ')}` : ''}
              </p>
            )}
          </Card>
        )}
      </div>
    </PublicLayout>
  );
}

export default function DnsLookupPage() {
  return (
    <Suspense fallback={<PublicLayout><div className="flex justify-center py-24 text-neutral-400">Loading...</div></PublicLayout>}>
      <DnsLookupContent />
    </Suspense>
  );
}
