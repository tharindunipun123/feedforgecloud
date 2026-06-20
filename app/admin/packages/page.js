'use client';

import { PageHeader, Card } from '@/components/ui';
import { EC2_PACKAGES, N8N_PACKAGES, AI_WEBSITE_PACKAGES, AI_CHATBOT_PACKAGES, PAYG_RATES } from '@/data/constants';
import { formatCurrency } from '@/lib/billing/helpers';

function PackageTable({ title, packages }) {
  return (
    <Card className="mb-8">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-800 text-neutral-400 text-left">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">ID</th>
              <th className="py-2 pr-4">Monthly</th>
              <th className="py-2">Renewal</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((p) => (
              <tr key={p.id} className="border-b border-neutral-800">
                <td className="py-2 pr-4 text-white">{p.name}</td>
                <td className="py-2 pr-4 text-neutral-400">{p.id}</td>
                <td className="py-2 pr-4 text-white">{formatCurrency(p.monthlyPrice)}</td>
                <td className="py-2 text-neutral-400">{formatCurrency(p.renewalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-500 mt-4">Package pricing is defined in constants. Firestore packages collection can be synced in a future update.</p>
    </Card>
  );
}

export default function AdminPackagesPage() {
  return (
    <div>
      <PageHeader title="Packages / Pricing" description="View current package pricing configuration." />
      <PackageTable title="EC2 Packages" packages={EC2_PACKAGES} />
      <PackageTable title="n8n Packages" packages={N8N_PACKAGES} />
      <PackageTable title="AI Website Packages" packages={AI_WEBSITE_PACKAGES} />
      <PackageTable title="AI Chatbot Packages" packages={AI_CHATBOT_PACKAGES} />
      <Card>
        <h2 className="text-lg font-semibold text-white mb-4">Pay-as-you-go Rates</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          {Object.entries(PAYG_RATES).map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b border-neutral-800">
              <span className="text-neutral-400 capitalize">{k}</span>
              <span className="text-white">{formatCurrency(v)}/unit/hr</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
