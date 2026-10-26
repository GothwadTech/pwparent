import React, { useState } from 'react';
import { X, Send, PhoneCall, Mail } from 'lucide-react';

interface ContactSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactSupportModal: React.FC<ContactSupportModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [queryText, setQueryText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryText.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setQueryText('');
      onClose();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-neutral-900 shadow-2xl relative animate-in fade-in zoom-in-95">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-neutral-600 hover:text-neutral-700 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-neutral-900">
          Contact PW Support
        </h3>
        <p className="text-xs text-neutral-500 mt-1 mb-4">
          Our parent helpline and academic advisors are here to assist you.
        </p>

        {submitted ? (
          <div className="py-8 text-center text-emerald-600 font-semibold text-sm">
            ✓ Ticket created! Our team will contact you shortly.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              rows={3}
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Describe your issue or query..."
              className="w-full p-3 rounded-xl border border-neutral-200 text-xs text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-[#5F45FF]"
              required
            />

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#5F45FF] hover:bg-[#5038e8] text-white font-bold text-xs flex items-center justify-center space-x-2 transition-colors shadow-xs"
              >
                <Send size={14} />
                <span>Submit Ticket</span>
              </button>

              <div className="flex items-center space-x-2 pt-2">
                <a
                  href="tel:07019243492"
                  className="flex-1 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold flex items-center justify-center space-x-1 transition-colors"
                >
                  <PhoneCall size={12} />
                  <span>Call Us</span>
                </a>
                <a
                  href="mailto:support@pw.live"
                  className="flex-1 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-semibold flex items-center justify-center space-x-1 transition-colors"
                >
                  <Mail size={12} />
                  <span>Email</span>
                </a>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
