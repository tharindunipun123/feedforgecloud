'use client';

import { useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/layout/PublicLayout';
import { Button, Input, Card, PageHeader, LoadingSpinner } from '@/components/ui';

export default function DomainCheckPage() {
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!domain.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/tools/domain-check?domain=${encodeURIComponent(domain.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      setResult(data);
    } catch (err) {
      setError(err.message || 'Domain check failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader
          title="Domain Availability Check"
          description="Check whether a domain name is available for registration."
        />
        <Card>
          <form onSubmit={handleCheck} className="space-y-4">
            <Input
              label="Domain name"
              placeholder="example.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
            <Button type="submit" disabled={loading || !domain.trim()}>
              {loading ? 'Checking...' : 'Check availability'}
            </Button>
          </form>
        </Card>

        {loading && (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        )}

        {error && <p className="mt-6 text-red-400 text-sm">{error}</p>}

        {result && !loading && (
          <Card className="mt-6">
            <div className="flex items-start gap-4">
              <div
                className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${
                  result.available ? 'bg-white' : 'bg-neutral-500'
                }`}
              />
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">{result.domain}</h2>
                <p
                  className={`text-sm font-medium mb-2 ${
                    result.available ? 'text-white' : 'text-neutral-400'
                  }`}
                >
                  {result.available ? 'Available' : 'Registered'}
                </p>
                <p className="text-neutral-400 text-sm">{result.message}</p>
                {result.expires && (
                  <p className="text-neutral-500 text-sm mt-2">Expires: {result.expires}</p>
                )}
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-neutral-800 flex flex-wrap gap-3">
              <Link href={`/whois-lookup?domain=${encodeURIComponent(result.domain)}`} className="text-sm text-neutral-300 hover:text-white">
                WHOIS lookup →
              </Link>
              <Link href={`/dns-lookup?domain=${encodeURIComponent(result.domain)}`} className="text-sm text-neutral-300 hover:text-white">
                DNS lookup →
              </Link>
            </div>
          </Card>
        )}

        <p className="mt-8 text-neutral-500 text-xs">
          Results are based on public RDAP data. Availability may differ at your registrar. For full registration details, use WHOIS lookup.
        </p>
      </div>
    </PublicLayout>
  );
}
