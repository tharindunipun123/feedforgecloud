'use client';

import { ServiceTypePage } from '../page';
import { PromoBanner } from '@/components/ui';

export default function N8nServicesPage() {
  return (
    <>
      <PromoBanner section="n8n" />
      <ServiceTypePage
        type="n8n"
        title="n8n Services"
        description="Manage your n8n automation instances."
      />
    </>
  );
}
