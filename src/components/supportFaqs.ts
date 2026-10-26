import type { FaqItem } from '../types';

/** The Help Centre's canned answers — pure content, so the view stays under the file cap. */
export const HELP_CENTRE_FAQS: FaqItem[] = [
  {
    id: 'where-is-my-order',
    question: 'Where is my order? How do I track my books / kit / welcome kit?',
    answer: [
      '1. Go to "My Orders" under profile to view all dispatched study kits.',
      '2. You will find tracking links and courier AWB numbers updated within 48 hours of dispatch.',
      '3. For delayed deliveries, please raise a ticket below with your order number.',
    ],
  },
  {
    id: 'switch-batches',
    question: 'I bought the wrong batch / I want to switch batches.',
    answer: [
      '1. Batch change requests can be made within 7 days of enrollment.',
      '2. Tap "Contact Us" below to submit your batch change request.',
      '3. Price difference (if any) will be adjusted accordingly.',
    ],
  },
  {
    id: 'cant-access-batch',
    question: "I can't access my batch or classes after buying.",
    answer: [
      '1. Ensure you are logged into the same mobile number used during purchase.',
      '2. Pull down to refresh your batch dashboard.',
      '3. If payment was recent, authorization may take up to 10 minutes.',
    ],
  },
  {
    id: 'library-ask-doubt',
    question: 'How do I use Library and Ask Doubt?',
    answer: [
      '1. In your lecture player, tap the "Doubts" tab on the right.',
      '2. Take a photo or type your question.',
      '3. Our doubt educators and Saarthi AI respond with step-by-step video solutions.',
    ],
  },
  {
    id: 'study-planner',
    question: 'How do I find / use the Planner (study schedule)?',
    answer: [
      '1. Navigate to the Study Planner icon on the batch home page.',
      '2. You can view daily targets, upcoming live classes, and DPP deadlines.',
    ],
  },
  {
    id: 'test-series-result',
    question: 'How do I attempt the test series / my test or result isn’t showing?',
    answer: [
      '1. Open the "Tests" tab in your dashboard.',
      '2. Results for all-India test series are published after the test window closes.',
    ],
  },
  {
    id: 'change-phone',
    question: 'I want to change my registered phone number / device',
    answer: [
      '1. You can update your phone number in Parent Profile settings.',
      '2. A verification OTP will be sent to both old and new numbers.',
    ],
  },
  {
    id: 'my-payment-failed',
    question: 'My payment failed or money was deducted without confirmation',
    isHelpfulPrompt: true,
    answer: [
      '1. If it shows "Payment Failed", we haven’t received the payment — any debited amount is auto-reversed by your bank/UPI app.',
      '2. Wait at least 24 hours before retrying; gateway/network delays are common.',
      '3. Do NOT pay again immediately — first check My Orders to see if an order was created.',
      '4. If money was debited and no order appears after 24 hours, contact your bank/payment app, and Raise a Ticket with your transaction reference.',
    ],
  },
  {
    id: 'live-class-not-playing',
    question: 'A live class isn’t playing / where are recorded classes?',
    answer: [
      '1. Check your internet connection speed (at least 2 Mbps recommended).',
      '2. Recorded lectures become available within 2 hours of live session completion.',
    ],
  },
  {
    id: 'refund-request',
    question: 'How do I request a refund and how long does it take?',
    answer: [
      '1. Review our refund policy in Terms & Conditions.',
      '2. Approved refunds are processed back to source within 5-7 working days.',
    ],
  },
];
