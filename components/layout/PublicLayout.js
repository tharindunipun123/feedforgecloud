import Navbar from './Navbar';
import Footer from './Footer';
import LiveChatWidget from '@/components/chat/LiveChatWidget';

export default function PublicLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <LiveChatWidget />
    </div>
  );
}
