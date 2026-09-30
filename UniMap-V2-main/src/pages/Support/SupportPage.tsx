import { Navbar, Footer } from '@/components/ui';
import { HelpCircle } from 'lucide-react';
import SupportForm from './SupportForm';
import Developer from './Developer';
import { usePageMeta } from '@/hooks/usePageMeta';
import './Support.css';

/**
 * SupportPage component.
 * Renders the Support Feedback page containing Navbar, SupportForm,
 * Developer guidance section, and Footer with a glowing dark background layout matching the design reference.
 */
export default function SupportPage() {
  usePageMeta(
    'Support & Feedback — MITS Map',
    'Contact support or share your feedback to help improve the MITS Gwalior campus map on UniMap.'
  );
  return (
    <div className="support-bg flex flex-col w-full min-h-screen">
      {/* Capsule top navbar */}
      <Navbar />
      
      {/* Background glow in center top */}
      <div className="support-glow" />

      {/* Main page content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 pt-32 pb-24 md:pt-36 max-w-4xl mx-auto w-full">
        {/* Get Help Badge */}
        <div className="inline-flex items-center gap-2 bg-[#ff602e]/10 border border-[#ff602e]/20 px-4 py-1.5 rounded-full mb-6 shadow-sm select-none">
          <HelpCircle className="w-3.5 h-3.5 text-[#ff602e]" />
          <span className="text-[10px] tracking-wide font-extrabold uppercase text-[#ff602e]">
            Get help
          </span>
        </div>

        {/* Support Header */}
        <h1 className="text-[36px] sm:text-[44px] md:text-[48px] font-bold tracking-tight text-white text-center leading-[1.1] mb-12 max-w-2xl select-none">
          Get support <br />
          or Share Your Feedback
        </h1>

        {/* Support Request Form */}
        <SupportForm />

        {/* Developer / Academic Guidance Section */}
        <Developer />
      </main>

      {/* Standard page Footer */}
      <Footer />
    </div>
  );
}
