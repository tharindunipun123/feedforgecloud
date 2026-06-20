'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, Card, LoadingSpinner, EmptyState, Button } from '@/components/ui';
import { getUserCdnSubscription } from '@/lib/firebase/cdn';

function CodeBlock({ title, code }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="mb-6">
      {title && <h3 className="text-white font-medium mb-3">{title}</h3>}
      <pre className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-sm text-neutral-300 overflow-x-auto mb-3">
        <code>{code}</code>
      </pre>
      <Button variant="secondary" size="sm" onClick={handleCopy}>
        {copied ? 'Copied' : 'Copy'}
      </Button>
    </Card>
  );
}

export default function CdnApiDocsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    if (!user) return;
    getUserCdnSubscription(user.uid).then((sub) => {
      setSubscription(sub);
      setLoading(false);
    });
  }, [user]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://quantumserver.cloud';

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>;
  }

  if (!subscription) {
    return (
      <div>
        <PageHeader title="API Documentation" description="CDN REST API reference." />
        <EmptyState
          title="No active CDN subscription"
          description="Subscribe to a CDN plan to access the API."
          action={
            <Link href="/cdn-pricing"><Button>Browse CDN plans</Button></Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="API Documentation"
        description="Use your API keys to upload and manage CDN assets programmatically."
        action={
          <Link href="/dashboard/cdn/api-keys">
            <Button variant="secondary" size="sm">Manage API keys</Button>
          </Link>
        }
      />

      <Card className="mb-8">
        <h2 className="text-lg font-semibold text-white mb-4">Authentication</h2>
        <p className="text-neutral-400 text-sm mb-4">
          Include your API key in the <code className="text-white">Authorization</code> header as a Bearer token.
        </p>
        <CodeBlock
          title="Header format"
          code={`Authorization: Bearer qscdn_your_api_key_here`}
        />
      </Card>

      <h2 className="text-xl font-semibold text-white mb-4">Endpoints</h2>

      <CodeBlock
        title="POST /api/cdn/upload — Upload a file"
        code={`curl -X POST ${baseUrl}/api/cdn/upload \\
  -H "Authorization: Bearer qscdn_your_api_key" \\
  -F "file=@/path/to/image.jpg"

# Response
{
  "success": true,
  "asset": {
    "id": "abc123",
    "fileName": "image.jpg",
    "fileSizeBytes": 102400,
    "fileType": "image",
    "publicUrl": "https://...",
    "cdnUrl": "https://cdn.quantumserver.cloud/abc123/image.jpg"
  }
}`}
      />

      <CodeBlock
        title="GET /api/cdn/assets — List all assets"
        code={`curl ${baseUrl}/api/cdn/assets \\
  -H "Authorization: Bearer qscdn_your_api_key"

# Response
{
  "assets": [
    {
      "id": "abc123",
      "fileName": "image.jpg",
      "fileSizeBytes": 102400,
      "fileType": "image",
      "mimeType": "image/jpeg",
      "publicUrl": "https://...",
      "cdnUrl": "https://cdn.quantumserver.cloud/abc123/image.jpg"
    }
  ]
}`}
      />

      <CodeBlock
        title="GET /api/cdn/assets/[id] — Get asset details"
        code={`curl ${baseUrl}/api/cdn/assets/abc123 \\
  -H "Authorization: Bearer qscdn_your_api_key"

# Response
{
  "id": "abc123",
  "fileName": "image.jpg",
  "fileSizeBytes": 102400,
  "fileType": "image",
  "mimeType": "image/jpeg",
  "publicUrl": "https://...",
  "cdnUrl": "https://cdn.quantumserver.cloud/abc123/image.jpg",
  "folder": "/",
  "tags": [],
  "altText": ""
}`}
      />

      <CodeBlock
        title="DELETE /api/cdn/assets/[id] — Delete an asset"
        code={`curl -X DELETE ${baseUrl}/api/cdn/assets/abc123 \\
  -H "Authorization: Bearer qscdn_your_api_key"

# Response
{ "success": true }`}
      />

      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Permissions</h2>
        <ul className="space-y-2 text-sm text-neutral-400">
          <li><span className="text-white">upload</span> — Required for POST /api/cdn/upload</li>
          <li><span className="text-white">read</span> — Required for GET endpoints</li>
          <li><span className="text-white">delete</span> — Required for DELETE /api/cdn/assets/[id]</li>
        </ul>
        <p className="text-neutral-500 text-xs mt-4">
          Keys created from the dashboard include upload and read permissions by default. Delete permission must be enabled when creating custom keys.
        </p>
      </Card>
    </div>
  );
}
