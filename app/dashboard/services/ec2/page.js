'use client';

import { ServiceTypePage } from '../page';
import { PromoBanner } from '@/components/ui';

export default function Ec2ServicesPage() {
  return (
    <>
      <PromoBanner section="ec2" />
      <ServiceTypePage
        type="ec2"
        title="EC2 Services"
        description="Manage your EC2 instances."
      />
    </>
  );
}
