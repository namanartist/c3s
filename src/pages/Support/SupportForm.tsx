import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { sendEmail } from '@/lib/emailjs';
import { useSearchParams } from 'react-router-dom';

/**
 * SupportForm component.
 * Renders Name, Email, and Use Case description inputs styled
 * as a premium dark-themed card container matching the design layout.
 */
export default function SupportForm() {
  const [searchParams] = useSearchParams();

  // Retrieve initial name and email from URL search parameters or fallback to localStorage
  const getInitialName = () => {
    return (
      searchParams.get('name') ||
      searchParams.get('userName') ||
      localStorage.getItem('name') ||
      localStorage.getItem('userName') ||
      ''
    );
  };

  const getInitialEmail = () => {
    return (
      searchParams.get('email') ||
      searchParams.get('userEmail') ||
      localStorage.getItem('email') ||
      localStorage.getItem('userEmail') ||
      ''
    );
  };

  const [name, setName] = useState(getInitialName);
  const [email, setEmail] = useState(getInitialEmail);
  const [useCase, setUseCase] = useState('');

  // Sync state if URL query parameters change
  useEffect(() => {
    const urlName = searchParams.get('name') || searchParams.get('userName');
    const urlEmail = searchParams.get('email') || searchParams.get('userEmail');
    if (urlName) setName(urlName);
    if (urlEmail) setEmail(urlEmail);
  }, [searchParams]);

  const [status, setStatus] = useState<{
    loading: boolean;
    success: boolean;
    error: string | null;
  }>({
    loading: false,
    success: false,
    error: null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !useCase.trim()) {
      setStatus({ loading: false, success: false, error: 'Please fill in all fields.' });
      return;
    }

    setStatus({ loading: true, success: false, error: null });

    const result = await sendEmail({
      from_name: name,
      from_email: email,
      reply_to: email,
      name: name,
      email: email,
      message: useCase,
    });

    if (result.success) {
      setStatus({ loading: false, success: true, error: null });
      
      // Save name and email to localStorage for future support requests
      localStorage.setItem('name', name);
      localStorage.setItem('email', email);

      setName('');
      setEmail('');
      setUseCase('');

      // Clear success message after 5 seconds
      setTimeout(() => {
        setStatus(prev => ({ ...prev, success: false }));
      }, 5000);
    } else {
      setStatus({ loading: false, success: false, error: result.message });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[640px] bg-[#121212]/90 backdrop-blur-xl border border-white/[0.06] rounded-[28px] p-6 md:p-8 flex flex-col gap-6 shadow-[0_24px_50px_-12px_rgba(0,0,0,0.5)]"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Name input */}
        <div className="flex flex-col text-left">
          <label htmlFor="name" className="text-xs font-semibold text-neutral-400 mb-2">
            Name
          </label>
          <input
            id="name"
            type="text"
            placeholder="Rahul"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[#1b1b1b] border border-white/[0.04] rounded-[14px] px-4 py-3.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#ff602e]/30 focus:ring-1 focus:ring-[#ff602e]/30 transition-all duration-200"
            required
            disabled={status.loading}
          />
        </div>

        {/* Email input */}
        <div className="flex flex-col text-left">
          <label htmlFor="email" className="text-xs font-semibold text-neutral-400 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="rahul@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#1b1b1b] border border-white/[0.04] rounded-[14px] px-4 py-3.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#ff602e]/30 focus:ring-1 focus:ring-[#ff602e]/30 transition-all duration-200"
            required
            disabled={status.loading}
          />
        </div>
      </div>

      {/* Use case textarea */}
      <div className="flex flex-col text-left">
        <label htmlFor="useCase" className="text-xs font-semibold text-neutral-400 mb-2">
          Describe your use case
        </label>
        <textarea
          id="useCase"
          placeholder="Use case"
          rows={5}
          value={useCase}
          onChange={(e) => setUseCase(e.target.value)}
          className="w-full bg-[#1b1b1b] border border-white/[0.04] rounded-[14px] px-4 py-3.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-[#ff602e]/30 focus:ring-1 focus:ring-[#ff602e]/30 transition-all duration-200 resize-none min-h-[130px]"
          required
          disabled={status.loading}
        />
      </div>

      {/* Status Messages */}
      {status.success && (
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 px-4 py-3.5 rounded-[14px] select-none animate-fade-in">
          <span>Thank you! Your feedback has been received.</span>
        </div>
      )}
      {status.error && (
        <div className="flex items-center gap-2 text-rose-400 text-xs font-semibold bg-rose-500/10 border border-rose-500/20 px-4 py-3.5 rounded-[14px] select-none animate-fade-in">
          <span>{status.error}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={status.loading}
        className="w-full bg-white hover:bg-neutral-100 disabled:bg-neutral-400 active:scale-[0.99] text-black font-semibold text-[13px] py-4 rounded-[14px] transition-all duration-200 cursor-pointer shadow-md mt-2 flex items-center justify-center gap-2"
      >
        {status.loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-black" />
            <span>Submitting...</span>
          </>
        ) : (
          <span>Submit</span>
        )}
      </button>
    </form>
  );
}

