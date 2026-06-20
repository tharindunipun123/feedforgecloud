import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let domain = searchParams.get('domain')?.trim().toLowerCase();

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required.' }, { status: 400 });
    }

    domain = domain.replace(/^https?:\/\//, '').split('/')[0];

    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
      return NextResponse.json({ error: 'Invalid domain format.' }, { status: 400 });
    }

    const res = await fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`, {
      headers: { Accept: 'application/rdap+json' },
      next: { revalidate: 60 },
    });

    if (res.status === 404) {
      return NextResponse.json({
        domain,
        status: 'available',
        available: true,
        message: `${domain} is likely available for registration.`,
      });
    }

    if (!res.ok) {
      return NextResponse.json({ error: 'Domain check failed. Try again later.' }, { status: 502 });
    }

    const data = await res.json();
    const expires = data.events?.find((e) => e.eventAction === 'expiration')?.eventDate;

    return NextResponse.json({
      domain,
      status: 'registered',
      available: false,
      message: `${domain} is already registered.`,
      expires: expires ? new Date(expires).toLocaleDateString() : null,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Domain check failed.' }, { status: 500 });
  }
}
