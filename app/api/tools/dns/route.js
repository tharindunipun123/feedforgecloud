import { NextResponse } from 'next/server';

const DNS_TYPES = { A: 1, AAAA: 28, MX: 15, TXT: 16, CNAME: 5, NS: 2 };

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain')?.trim().toLowerCase();
    const type = (searchParams.get('type') || 'A').toUpperCase();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required.' }, { status: 400 });
    }

    if (!DNS_TYPES[type]) {
      return NextResponse.json({ error: 'Invalid record type.' }, { status: 400 });
    }

    const dnsType = DNS_TYPES[type];
    const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${dnsType}`;

    const res = await fetch(url, {
      headers: { Accept: 'application/dns-json' },
      next: { revalidate: 60 },
    });

    const data = await res.json();

    const records = (data.Answer || []).map((record) => ({
      name: record.name?.replace(/\.$/, '') || domain,
      type,
      ttl: record.TTL,
      value: record.data,
    }));

    return NextResponse.json({
      domain,
      type,
      status: data.Status,
      records,
      authority: (data.Authority || []).map((r) => r.data),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'DNS lookup failed.' }, { status: 500 });
  }
}
