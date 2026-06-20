# QuantumServer.cloud

A complete VPS hosting platform built with **Next.js (JavaScript)**, **Tailwind CSS**, and **Firebase**.

## Features

- Full Hostinger-inspired hosting purchase flow (landing, pricing, cart, checkout)
- VPS Hosting, Pay-as-you-go VPS, n8n, AI Website Builder, AI Chatbot services
- DNS & WHOIS lookup tools
- Cart system with Firestore persistence (logged-in) and localStorage (guest)
- 5-step checkout with order creation
- Payment confirmed via admin or payment provider callback only
- User dashboard (services, billing, invoices, support, live chat)
- Admin panel (orders, provisioning, usage charges, legal editor)
- Invoice system with PDF download
- Support tickets and Firebase live chat
- Black & white dark theme

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Firebase

Copy `.env.example` to `.env.local` and add your Firebase project credentials:

```bash
cp .env.example .env.local
```

### 3. Deploy Firestore rules

```bash
firebase deploy --only firestore:rules
```

### 4. Create an admin user

After registering a user, set their role in Firestore:

```
users/{uid}/role = "admin"
```

### 5. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
app/                  # Next.js App Router pages
  dashboard/          # User dashboard
  admin/              # Admin panel
  cart/               # Shopping cart
  checkout/           # Checkout flow
components/           # Reusable UI components
contexts/             # Auth & Cart providers
lib/
  firebase/           # Firebase config & Firestore helpers
  cart/               # Cart logic
  billing/            # Invoice helpers & PDF generation
data/                 # Constants & package definitions
firestore.rules       # Firestore security rules
```

## Payment Flow

1. User completes checkout → order created with `pending_payment` status
2. Payment confirmed when admin clicks "Confirm Payment" or payment provider updates Firestore
3. On confirmation: invoice created, services provisioned, status → `payment_confirmed` / `provisioning`
4. User redirected to payment success page

## Tech Stack

- Next.js 16 (App Router, JavaScript)
- Tailwind CSS 4
- Firebase Auth, Firestore, Storage
- jsPDF for invoice PDFs

## License

Private — QuantumServer.cloud
