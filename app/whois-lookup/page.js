'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Input, Card, PageHeader, LoadingSpinner } from '@/components/ui';

function WhoisLookupContent() {
  const searchParams = useSearchParams();
  const [domain, setDomain] = useState('');
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
      const res = await fetch(`/api/tools/whois?domain=${encodeURIComponent(domain.trim())}`);
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
        <PageHeader title="WHOIS Lookup" description="Look up domain registration information via public RDAP data." />
        <Card>
          <form onSubmit={handleLookup} className="space-y-4">
            <Input label="Domain name" placeholder="example.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
            <Button type="submit" disabled={loading || !domain.trim()}>
              {loading ? 'Looking up...' : 'Lookup WHOIS'}
            </Button>
          </form>
        </Card>

        {loading && (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        )}

        {error && <p className="mt-6 text-red-400 text-sm">{error}</p>}

        {results && !loading && (
          <Card className="mt-6">
            <h2 className="text-lg font-semibold text-white mb-4">WHOIS for {results.domain}</h2>
            {results.available ? (
              <div>
                <p className="text-white font-medium mb-2">Domain appears available</p>
                <p className="text-neutral-400 text-sm mb-4">{results.message}</p>
                <Link href={`/domain-check?domain=${encodeURIComponent(results.domain)}`} className="text-sm text-neutral-300 hover:text-white">
                  Run availability check →
                </Link>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {[
                  ['Registrar', results.registrar || '—'],
                  ['Creation date', results.created || '—'],
                  ['Expiry date', results.expires || '—'],
                  ['Status', results.status || '—'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-2 border-b border-neutral-800 gap-4">
                    <span className="text-neutral-400 shrink-0">{label}</span>
                    <span className="text-white text-right break-all">{value}</span>
                  </div>
                ))}
                <div className="pt-2">
                  <span className="text-neutral-400 block mb-2">Nameservers</span>
                  {(results.nameservers || ['—']).map((ns, i) => (
                    <p key={i} className="text-white">{ns}</p>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </PublicLayout>
  );
}

export default function WhoisLookupPage() {
  return (
    <Suspense fallback={<PublicLayout><div className="flex justify-center py-24 text-neutral-400">Loading...</div></PublicLayout>}>
      <WhoisLookupContent />
    </Suspense>
  );
}
