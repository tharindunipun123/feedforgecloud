import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain')?.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

    if (!domain || !domain.includes('.')) {
      return NextResponse.json({ error: 'Valid domain is required.' }, { status: 400 });
    }

    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: { Accept: 'application/rdap+json' },
      next: { revalidate: 300 },
    });

    if (res.status === 404) {
      return NextResponse.json({
        domain,
        available: true,
        registered: false,
        message: 'Domain appears to be available for registration.',
      });
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'WHOIS lookup failed.' }, { status: 502 });
    }

    const data = await res.json();

    const registrar = data.entities?.find((e) => e.roles?.includes('registrar'));
    const registrarName = registrar?.vcardArray?.[1]?.find((v) => v[0] === 'fn')?.[3] || '—';

    const events = data.events || [];
    const created = events.find((e) => e.eventAction === 'registration')?.eventDate;
    const expires = events.find((e) => e.eventAction === 'expiration')?.eventDate;

    const nameservers = (data.nameservers || [])
      .map((ns) => ns.ldhName?.replace(/\.$/, ''))
      .filter(Boolean);

    const status = (data.status || []).join(', ') || '—';

    return NextResponse.json({
      domain,
      available: false,
      registered: true,
      registrar: registrarName,
      created: created ? new Date(created).toLocaleDateString() : '—',
      expires: expires ? new Date(expires).toLocaleDateString() : '—',
      status,
      nameservers: nameservers.length ? nameservers : ['—'],
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'WHOIS lookup failed.' }, { status: 500 });
  }
}
