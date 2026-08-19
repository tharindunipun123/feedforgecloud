'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import PublicLayout from '@/components/layout/PublicLayout';
import PaymentGatewayPanel from '@/components/checkout/PaymentGatewayPanel';
import { Button, Input, Card, Select, LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { processCheckoutPayment } from '@/lib/firebase/firestore';
import { formatCurrency, CHECKOUT_TAX_PER_PACKAGE } from '@/lib/billing/helpers';
import { isPaymentTestMode } from '@/data/countries';
import { auth } from '@/lib/firebase/config';
import { OS_OPTIONS, SERVER_LOCATIONS } from '@/data/constants';
import { STREAMING_REGIONS } from '@/data/streaming';
import { hasStreamingInCart, hasSslInCart, isAnnualOnlyItem } from '@/lib/cart/helpers';
import {
  COUNTRIES,
  getCountryName,
  getPaymentGatewayForCountry,
} from '@/data/countries';

const STEPS = ['Account', 'Customer Details', 'Service Config', 'Review', 'Payment'];

export default function CheckoutPage() {
  const { user, userData } = useAuth();
  const { items, subtotal, tax, discount, total, billingCycle, loaded, clearCart, updateItem } = useCart();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    countryCode: '',
    zip: '',
    organizationName: '',
    brNumber: '',
    organizationAddress: '',
  });

  const streamingOrder = hasStreamingInCart(items);
  const sslOrder = hasSslInCart(items);
  const paymentGateway = customer.countryCode
    ? getPaymentGatewayForCountry(customer.countryCode)
    : null;

  useEffect(() => {
    if (userData) {
      setCustomer((c) => ({
        ...c,
        name: userData.name || '',
        email: userData.email || user?.email || '',
        organizationName: userData.organizationName || c.organizationName,
        brNumber: userData.brNumber || c.brNumber,
        organizationAddress: userData.organizationAddress || c.organizationAddress,
      }));
    }
  }, [userData, user]);

  useEffect(() => {
    if (loaded && items.length === 0) {
      router.replace('/cart');
    }
  }, [loaded, items.length, router]);

  if (!loaded) {
    return (
      <PublicLayout>
        <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>
      </PublicLayout>
    );
  }

  if (items.length === 0) {
    return (
      <PublicLayout>
        <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>
      </PublicLayout>
    );
  }

  const canNext = () => {
    if (step === 0) return !!user;
    if (step === 1) {
      const base =
        customer.name &&
        customer.email &&
        customer.phone &&
        customer.address &&
        customer.countryCode;
      if (streamingOrder) {
        return base && customer.organizationName && customer.brNumber;
      }
      return base;
    }
    if (step === 2) {
      const sslItems = items.filter((i) => i.type === 'ssl_certificate');
      if (sslItems.some((i) => !i.config?.domain?.trim())) return false;
    }
    return true;
  };

  const handlePayment = async () => {
    if (!user || !paymentGateway) return;

    setSubmitting(true);
    setError('');

    try {
      const orderPayload = {
        items,
        subtotal,
        tax,
        discount,
        total,
        billingCycle: sslOrder ? 'annual' : billingCycle,
        currency: 'USD',
        customer: {
          ...customer,
          countryCode: customer.countryCode,
          country: getCountryName(customer.countryCode),
        },
        coupon: null,
      };

      const testMode = isPaymentTestMode();

      if (testMode) {
        const { orderId } = await processCheckoutPayment(user.uid, orderPayload, paymentGateway, {
          testMode: true,
        });
        await clearCart();
        router.push(`/payment/success?orderId=${orderId}`);
        return;
      }

      if (paymentGateway.id === 'stripe') {
        if (!auth?.currentUser) {
          throw new Error('Your session expired. Please sign in again.');
        }
        const idToken = await auth.currentUser.getIdToken(true);
        const res = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ orderPayload, gatewayId: 'stripe' }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to start Stripe checkout.');

        await clearCart();
        window.location.href = data.url;
        return;
      }

      throw new Error('Unsupported payment method for this order.');
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

        <div className="flex flex-wrap gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border ${
                i === step
                  ? 'border-white text-white bg-neutral-900'
                  : i < step
                    ? 'border-neutral-600 text-neutral-300'
                    : 'border-neutral-800 text-neutral-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-xs">
                {i + 1}
              </span>
              {s}
            </div>
          ))}
        </div>

        {error && step !== 4 && <p className="mb-4 text-red-400 text-sm">{error}</p>}

        {step === 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Account</h2>
            {user ? (
              <p className="text-neutral-400">
                Signed in as <span className="text-white">{user.email}</span>
              </p>
            ) : (
              <div className="space-y-4">
                <p className="text-neutral-400">Please log in or create an account to continue.</p>
                <div className="flex gap-3">
                  <Link href="/login?redirect=/checkout"><Button>Log in</Button></Link>
                  <Link href="/register?redirect=/checkout"><Button variant="secondary">Register</Button></Link>
                </div>
              </div>
            )}
          </Card>
        )}

        {step === 1 && (
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-white mb-2">Customer details</h2>
            <p className="text-sm text-neutral-400 mb-2">
              All payments are processed securely via Stripe in USD.
            </p>
            <Input
              label="Full name"
              value={customer.name}
              onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              value={customer.email}
              onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
              required
            />
            <Input
              label="Phone"
              value={customer.phone}
              onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
              required
            />
            <Input
              label="Billing address"
              value={customer.address}
              onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
              required
            />
            <div className="grid sm:grid-cols-3 gap-4">
              <Input
                label="City"
                value={customer.city}
                onChange={(e) => setCustomer({ ...customer, city: e.target.value })}
              />
              <Select
                label="Country"
                value={customer.countryCode}
                onChange={(e) => setCustomer({ ...customer, countryCode: e.target.value })}
                options={[
                  { value: '', label: 'Select country' },
                  ...COUNTRIES.map((c) => ({ value: c.code, label: c.name })),
                ]}
              />
              <Input
                label="ZIP"
                value={customer.zip}
                onChange={(e) => setCustomer({ ...customer, zip: e.target.value })}
              />
            </div>

            {streamingOrder && (
              <div className="border border-neutral-800 rounded-lg p-4 space-y-4">
                <h3 className="text-white font-medium">Organization details</h3>
                <p className="text-xs text-neutral-500">
                  Required for live streaming service registration and compliance.
                </p>
                <Input
                  label="Organization / station name"
                  value={customer.organizationName}
                  onChange={(e) => setCustomer({ ...customer, organizationName: e.target.value })}
                  required
                />
                <Input
                  label="Business registration number (BR)"
                  value={customer.brNumber}
                  onChange={(e) => setCustomer({ ...customer, brNumber: e.target.value })}
                  required
                />
                <Input
                  label="Organization address"
                  value={customer.organizationAddress}
                  onChange={(e) => setCustomer({ ...customer, organizationAddress: e.target.value })}
                />
              </div>
            )}

            {paymentGateway && (
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-sm">
                <p className="text-neutral-400">
                  Payment method for <span className="text-white">{getCountryName(customer.countryCode)}</span>:
                </p>
                <p className="text-white font-medium mt-1">{paymentGateway.label}</p>
              </div>
            )}
          </Card>
        )}

        {step === 2 && (
          <Card className="space-y-6">
            <h2 className="text-lg font-semibold text-white mb-2">Service configuration</h2>
            {items.map((item) => (
              <div key={item.id} className="border border-neutral-800 rounded-lg p-4">
                <h3 className="text-white font-medium mb-3">{item.name}</h3>
                {(item.type === 'ec2' || item.type === 'vps' || item.type === 'payg') && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Select
                      label="Operating system"
                      value={item.config?.os || OS_OPTIONS[0]}
                      onChange={(e) =>
                        updateItem(item.id, { config: { ...item.config, os: e.target.value } })
                      }
                      options={OS_OPTIONS.map((o) => ({ value: o, label: o }))}
                    />
                    <Select
                      label="Server location"
                      value={item.config?.location || SERVER_LOCATIONS[0].id}
                      onChange={(e) =>
                        updateItem(item.id, { config: { ...item.config, location: e.target.value } })
                      }
                      options={SERVER_LOCATIONS.map((l) => ({ value: l.id, label: l.name }))}
                    />
                  </div>
                )}
                {item.type === 'live_streaming' && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Select
                      label="Streaming region"
                      value={item.config?.region || STREAMING_REGIONS[0].id}
                      onChange={(e) =>
                        updateItem(item.id, { config: { ...item.config, region: e.target.value } })
                      }
                      options={STREAMING_REGIONS.map((r) => ({ value: r.id, label: r.name }))}
                    />
                    <Select
                      label="Pay-as-you-go overages"
                      value={item.config?.payAsYouGo ? 'yes' : 'no'}
                      onChange={(e) =>
                        updateItem(item.id, {
                          config: { ...item.config, payAsYouGo: e.target.value === 'yes' },
                        })
                      }
                      options={[
                        { value: 'no', label: 'Disabled — fixed package limits' },
                        { value: 'yes', label: 'Enabled — bill extra usage monthly' },
                      ]}
                    />
                    <div className="sm:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-400">
                      Node.js stack: Icecast2 + Liquidsoap. Your stream enters{' '}
                      <span className="text-yellow-400">pending provisioning</span> after payment until our team activates your server in the selected region.
                    </div>
                  </div>
                )}
                {item.type === 'ssl_certificate' && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input
                      label="Primary domain"
                      placeholder="example.com or *.example.com"
                      value={item.config?.domain || ''}
                      onChange={(e) =>
                        updateItem(item.id, { config: { ...item.config, domain: e.target.value } })
                      }
                      required
                      className="sm:col-span-2"
                    />
                    <Input
                      label="Additional domains (optional)"
                      placeholder="www.example.com, api.example.com"
                      value={item.config?.additionalDomains || ''}
                      onChange={(e) =>
                        updateItem(item.id, { config: { ...item.config, additionalDomains: e.target.value } })
                      }
                      className="sm:col-span-2"
                    />
                    <div className="sm:col-span-2 bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-400">
                      <span className="text-emerald-400">Annual billing only</span> — {formatCurrency(item.price)}/year + {formatCurrency(CHECKOUT_TAX_PER_PACKAGE)} tax.
                      Certificate enters <span className="text-yellow-400">pending provisioning</span> until issued.
                    </div>
                  </div>
                )}
              </div>
            ))}
          </Card>
        )}

        {step === 3 && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Review order</h2>
            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm py-2 border-b border-neutral-800">
                  <span className="text-neutral-300">
                    {item.name} × {item.quantity || 1}
                    {item.type === 'live_streaming' && item.config?.region && (
                      <span className="text-neutral-500 block text-xs mt-0.5">
                        Region: {STREAMING_REGIONS.find((r) => r.id === item.config.region)?.name || item.config.region}
                        {item.config?.payAsYouGo ? ' · PAYG enabled' : ''}
                      </span>
                    )}
                  </span>
                  <span className="text-white">
                    {formatCurrency(item.price * (item.quantity || 1))}
                    {isAnnualOnlyItem(item) && (
                      <span className="text-neutral-500 text-xs block">/year · annual only</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-neutral-400">Subtotal</span>
                <span className="text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Tax ({formatCurrency(CHECKOUT_TAX_PER_PACKAGE)}/package)</span>
                <span className="text-white">{formatCurrency(tax)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">Discount</span>
                  <span className="text-white">−{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold pt-2 border-t border-neutral-800">
                <span className="text-white">Total</span>
                <span className="text-white">{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">Country</span>
                <span className="text-white">{getCountryName(customer.countryCode)}</span>
              </div>
              {streamingOrder && customer.organizationName && (
                <>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Organization</span>
                    <span className="text-white">{customer.organizationName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">BR number</span>
                    <span className="text-white font-mono text-xs">{customer.brNumber}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-neutral-400">Payment method</span>
                <span className="text-white">{paymentGateway?.label}</span>
              </div>
            </div>
          </Card>
        )}

        {step === 4 && paymentGateway && (
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Payment</h2>
            <PaymentGatewayPanel
              gateway={paymentGateway}
              countryName={getCountryName(customer.countryCode)}
              total={total}
              onPay={handlePayment}
              submitting={submitting}
              error={error}
            />
          </Card>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0 || submitting}
          >
            Back
          </Button>
          {step < 4 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()}>
              Continue
            </Button>
          ) : null}
        </div>
      </div>
    </PublicLayout>
  );
}
