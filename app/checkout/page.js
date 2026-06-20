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
import { formatCurrency } from '@/lib/billing/helpers';
import { isPaymentTestMode } from '@/data/countries';
import { resolveGenieBizCheckout, formatLkr } from '@/data/geniebiz';
import { openPaymentPopup, markPaymentPopupOpened } from '@/lib/payment/open-payment-popup';
import { auth } from '@/lib/firebase/config';
import { OS_OPTIONS, SERVER_LOCATIONS } from '@/data/constants';
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
  });

  const paymentGateway = customer.countryCode
    ? getPaymentGatewayForCountry(customer.countryCode)
    : null;

  const genieBizCheckout = paymentGateway?.id === 'geniebiz'
    ? resolveGenieBizCheckout(items, billingCycle)
    : null;
  const genieBizPayment = genieBizCheckout?.eligible ? genieBizCheckout.payment : null;

  useEffect(() => {
    if (userData) {
      setCustomer((c) => ({
        ...c,
        name: userData.name || '',
        email: userData.email || user?.email || '',
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
      return (
        customer.name &&
        customer.email &&
        customer.phone &&
        customer.address &&
        customer.countryCode
      );
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
        billingCycle,
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
        const idToken = await auth.currentUser.getIdToken();
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

      if (paymentGateway.id === 'geniebiz') {
        const resolved = resolveGenieBizCheckout(items, billingCycle);
        if (!resolved.eligible) {
          throw new Error(resolved.error);
        }

        const { payment } = resolved;
        const { orderId } = await processCheckoutPayment(user.uid, orderPayload, paymentGateway, {
          testMode: false,
          geniebizPayLink: payment.payLink,
          geniebizAmountLkr: payment.amountLkr,
        });

        await clearCart();

        const pendingUrl = `/payment/pending?orderId=${encodeURIComponent(orderId)}&amount=${payment.amountLkr}&link=${encodeURIComponent(payment.payLink)}`;
        const popupResult = openPaymentPopup(payment.payLink);
        if (popupResult.success) {
          markPaymentPopupOpened(orderId);
        }
        router.push(pendingUrl);
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
              Your country determines the available payment method at checkout.
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
                  </span>
                  <span className="text-white">
                    {formatCurrency(item.price * (item.quantity || 1))}
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
                <span className="text-neutral-400">Tax</span>
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
                <span className="text-white">
                  {genieBizPayment ? formatLkr(genieBizPayment.amountLkr) : formatCurrency(total)}
                </span>
              </div>
            </div>

            <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-neutral-400">Country</span>
                <span className="text-white">{getCountryName(customer.countryCode)}</span>
              </div>
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
              error={error || (!genieBizPayment && paymentGateway.id === 'geniebiz' && !isPaymentTestMode() ? genieBizCheckout?.error : '')}
              genieBizPayment={genieBizPayment}
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
