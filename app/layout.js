import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/layout/Providers';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Feed Forge — EC2 Hosting Platform',
  description: 'Enterprise EC2 hosting, pay-as-you-go servers, n8n automation, AI website builder, and chatbot services.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
