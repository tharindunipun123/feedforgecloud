'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { NAV_SERVICES, BRAND_NAME } from '@/data/constants';
import { NAV_SUPPORT, NAV_TOOLS, NAV_PRICING } from '@/data/knowledge-base';

function NavDropdown({ label, items, open, onToggle, onClose }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="text-neutral-300 hover:text-white text-sm font-medium flex items-center gap-1"
      >
        {label}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-neutral-950 border border-neutral-800 rounded-xl shadow-xl py-2 z-50">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-4 py-2.5 text-sm text-neutral-300 hover:text-white hover:bg-neutral-900"
              onClick={onClose}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);

  const closeAll = () => {
    setServicesOpen(false);
    setPricingOpen(false);
    setSupportOpen(false);
    setToolsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-black/95 backdrop-blur border-b border-neutral-800">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6 lg:gap-8">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <Image src="/logo.png" alt={BRAND_NAME} width={36} height={36} className="rounded-lg" />
              <span className="font-bold text-white hidden sm:block text-lg tracking-tight">{BRAND_NAME}</span>
            </Link>

            <div className="hidden xl:flex items-center gap-5">
              <NavDropdown
                label="Services"
                items={NAV_SERVICES}
                open={servicesOpen}
                onToggle={() => { closeAll(); setServicesOpen(!servicesOpen); }}
                onClose={closeAll}
              />
              <NavDropdown
                label="Pricing"
                items={NAV_PRICING}
                open={pricingOpen}
                onToggle={() => { closeAll(); setPricingOpen(!pricingOpen); }}
                onClose={closeAll}
              />
              <NavDropdown
                label="Support"
                items={NAV_SUPPORT}
                open={supportOpen}
                onToggle={() => { closeAll(); setSupportOpen(!supportOpen); }}
                onClose={closeAll}
              />
              <NavDropdown
                label="Tools"
                items={NAV_TOOLS}
                open={toolsOpen}
                onToggle={() => { closeAll(); setToolsOpen(!toolsOpen); }}
                onClose={closeAll}
              />
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-4">
            <Link href="/cart" className="relative text-neutral-300 hover:text-white p-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            {user ? (
              <Link href={isAdmin ? '/admin' : '/dashboard'} className="text-neutral-300 hover:text-white text-sm font-medium">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-neutral-300 hover:text-white text-sm font-medium">Login</Link>
                <Link href="/register" className="px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-neutral-200 transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>

          <button className="lg:hidden text-white p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <div className="lg:hidden py-4 border-t border-neutral-800 max-h-[70vh] overflow-y-auto">
            {[
              { title: 'Services', items: NAV_SERVICES },
              { title: 'Pricing', items: NAV_PRICING },
              { title: 'Support', items: NAV_SUPPORT },
              { title: 'Tools', items: NAV_TOOLS },
            ].map((group) => (
              <div key={group.title} className="mb-4">
                <p className="text-xs text-neutral-500 uppercase tracking-wider px-2 mb-2">{group.title}</p>
                {group.items.map((item) => (
                  <Link key={item.href} href={item.href} className="block px-2 py-2 text-neutral-300 hover:text-white" onClick={() => setMobileOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
            <Link href="/cart" className="block px-2 py-2 text-neutral-300 hover:text-white" onClick={() => setMobileOpen(false)}>
              Cart {itemCount > 0 && `(${itemCount})`}
            </Link>
            {user ? (
              <Link href={isAdmin ? '/admin' : '/dashboard'} className="block px-2 py-2 text-neutral-300 hover:text-white" onClick={() => setMobileOpen(false)}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="block px-2 py-2 text-neutral-300 hover:text-white" onClick={() => setMobileOpen(false)}>Login</Link>
                <Link href="/register" className="block px-2 py-2 text-white font-medium" onClick={() => setMobileOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
