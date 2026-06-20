'use client';

import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import { PricingCard } from '@/components/home/PricingCard';
import { PageHeader } from '@/components/ui';
import { AI_CHATBOT_PACKAGES } from '@/data/constants';
import { useCart } from '@/contexts/CartContext';
import { createServiceCartItem } from '@/lib/cart/helpers';

export default function AiChatbotPage() {
  const { addItem } = useCart();
  const router = useRouter();

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <PageHeader
          title="AI Chatbot Service"
          description="Deploy intelligent chatbots for your website with custom branding and analytics."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mb-12">
          {AI_CHATBOT_PACKAGES.map((pkg) => (
            <PricingCard
              key={pkg.id}
              pkg={pkg}
              onAddToCart={async (p) => { await addItem(createServiceCartItem(p, 'ai-chatbot')); router.push('/cart'); }}
            />
          ))}
        </div>
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Features</h2>
          <ul className="grid md:grid-cols-2 gap-4 text-sm text-neutral-400">
            {['Website widget embed', 'Custom branding', 'Conversation analytics', 'Multi-channel on Business plan'].map((f) => (
              <li key={f} className="flex items-center gap-2"><span className="text-white">✓</span>{f}</li>
            ))}
          </ul>
        </div>
      </div>
    </PublicLayout>
  );
}
