import {
  HOSTING_BILLING_START_DAY,
  HOSTING_MONTHLY_PRICE_MO_LABEL,
  HOSTING_TRIAL_DAYS,
} from "@/lib/hosting-policy";
import { siteUrl } from "@/lib/site-origin";

export type FAQItem = { q: string; a: string };

const FAQ_LINK_RE = /\[([^\]]+)\]\(([^)]+)\)/g;

/** Plain text for JSON-LD - expands [label](/path) to label (full URL). */
export function faqPlainAnswer(a: string): string {
  return a.replace(FAQ_LINK_RE, (_, label: string, href: string) => {
    const url = href.startsWith("/") ? siteUrl(href) : href;
    return `${label} (${url})`;
  });
}

export const faq: FAQItem[] = [
  {
    q: "What's actually included for $5,998?",
    a: "A handcrafted custom site (not a template) of up to 6 pages, mobile-optimized, with click-to-call, click-to-map, and a contact form. Designed around your business in 7 business days from the moment payment clears.",
  },
  {
    q: "How is the $5,998 design fee paid?",
    a: `On a 50 / 40 / 10 schedule - the same structure for every project. You pay 50% ($2,999) at checkout to enter the queue. The remaining 40% ($2,399.20) is due after design approval or when development starts. The final 10% ($599.80) is due at launch and handover. Promo codes reduce each milestone proportionally (design fee only - not hosting or the card fee). Hosting is not charged at signup: your first ${HOSTING_TRIAL_DAYS} days of hosting are free. After ${HOSTING_TRIAL_DAYS} days from your cleared deposit, month-to-month hosting is ${HOSTING_MONTHLY_PRICE_MO_LABEL} (cancel before day ${HOSTING_BILLING_START_DAY} and you won't be charged), or 10-year hosting is a one-time $2,996 (we email a secure payment link on day ${HOSTING_BILLING_START_DAY}; domain registration for .com, .net, or .org is included). Checkout defaults to card; bank transfer is list price with no 3% processing fee on the design portion due today. The design clock starts when your 50% deposit clears. Bank transfers may take a few business days to settle.`,
  },
  {
    q: "Can I pay by card or bank?",
    a: `Checkout defaults to credit or debit card. Before you pay, you can switch to bank transfer (ACH) for list price with no 3% processing fee on the design fee. The 3% card fee applies to the design fee only - not to hosting, which is billed after your ${HOSTING_TRIAL_DAYS}-day free period. Bank payments may take a few business days to settle; the design clock starts when Stripe confirms cleared funds.`,
  },
  {
    q: "What happens if I go quiet during the design or approval process?",
    a: "Life happens. If we send a draft and don't hear back within 14 days, we'll mark the project complete and deliver the best version we have. Your 50% deposit and any milestones already paid are not refunded - the remaining balance still follows the published 50 / 40 / 10 schedule (40% at development start, 10% at launch). Your files are held for 90 days; come back any time in that window and we'll jump back in under normal edit terms. After 90 days, a $349 re-engagement fee applies to reopen the project. We say this up front because surprise late fees are agency behavior and we don't do that.",
  },
  {
    q: "How is this so much cheaper than an agency?",
    a: "We keep scope tight on purpose. We do one thing - design and host a great-looking, fast small-business website - and we do it without account managers, retainers, or a slide deck full of jargon. The $5,998 covers exactly what's listed; anything beyond it is priced clearly upfront.",
  },
  {
    q: "Who owns the site?",
    a: "You do. Always. The design is yours. The domain is yours. If you ever want to leave, we hand over a clean export. No lock-in clause, no ransom.",
  },
  {
    q: "Where is my site hosted? Is it fast and secure?",
    a: "On edge cloud hosting - the same enterprise-grade infrastructure that powers Stripe, OpenAI, Shopify, DoorDash, and Discord. In plain English: your site loads fast for visitors anywhere in the world (it's served from the data center closest to them), HTTPS encryption is automatic and renewed for free for the life of the site, and the site scales itself if you get a sudden rush - a local news mention, a viral post, a holiday surge. Bot floods and DDoS attacks get filtered before they hit your site, pages cache at the edge for snappy repeat visits, and there are no servers to maintain or IT person to call. We handle every piece of it.",
  },
  {
    q: "What are the hosting limits?",
    a: "Built for a standard small-business website - not a media server or app platform.\n\n• Pages: Up to 6 (same as your design package)\n• Storage: ~500 MB for site files - enough for a full local business site with optimized photos\n• Bandwidth: Unmetered for normal business traffic (forms, calls, maps, everyday browsing)\n• Traffic spikes: Local news mentions, busy seasons, viral posts - included; the site scales automatically\n• SSL & security: HTTPS included and auto-renewed; DDoS protection at the edge\n• Domain: .com, .net, or .org registration included with 10-year hosting\n\nFair use: Hosting covers your business website. It is not for large file downloads, video streaming, heavy e-commerce catalogs, or custom software. If your needs grow beyond this, we'll talk before anything changes - routine growth and traffic spikes are already covered in your hosting fee.",
  },
  {
    q: "What if I want to leave?",
    a: "Month-to-month hosting: cancel anytime. 10-year hosting: your site stays hosted with us for ten years - and you can migrate and transfer your domain elsewhere whenever you want; we'll hand over the files. You are responsible for all domain transfer fees.",
  },
  {
    q: "How do I manage hosting billing?",
    a: "Month-to-month clients can update a card, view invoices, or cancel hosting anytime. Go to [manage hosting billing](/hosting/manage), enter the email on your account, and we'll email a secure one-time link to Stripe's billing portal. Cancellation takes effect at the end of your current billing period. 10-year hosting is a one-time charge - there is no recurring subscription to manage.",
  },
  {
    q: "What's the edit policy after month three?",
    a: "Edits are free for the first three months while we get everything dialed in. After that, submit edits via form for $10 each, with a $50 minimum top-up on your account. You see the balance, you see each deduction. No mystery line items.",
  },
  {
    q: "Do you do logos, copywriting, or SEO?",
    a: "Logos and full copywriting are not part of the $5,998 design fee - we design around what you already have, or we quote creative separately. Every site includes technical SEO basics (meta titles, speed, mobile, clean structure). Hyper-local SEO, Google Profile Optimization, blogging strategies, and the other growth add-ons on the home page are optional - priced clearly if you want them.",
  },
  {
    q: "What is Jarvis, and where does it run?",
    a: "Jarvis is our AI voice chatbot add-on ($499 setup, $149/mo) - visitors talk to your site in real time, the same way they can try Jarvis on our home page. It is separate from the typed AI Agent Chatbot ($299 setup, $79/mo). For optimum performance, Jarvis runs only on our cloud edge service (the same infrastructure as your 998 site). We do not support third-party or self-hosted setups - edge placement keeps voice latency low and responses consistent when traffic spikes.",
  },
  {
    q: "Can you set up business texting (SMS) for my company?",
    a: "Yes - we have experience with US A2P 10DLC registration (the carrier compliance process for business texting). It includes registering your brand, submitting a messaging campaign with sample messages and opt-in details, and linking your sending number to that campaign. Approval normally takes about two to three weeks; sometimes it's faster, sometimes longer if carriers ask for changes or a resubmission is needed. Until the campaign is verified, texts can be blocked or filtered even when everything looks wired correctly in Twilio. Our Email & SMS add-on covers setup and ongoing two-way texting - ask us if you want it on your project.",
  },
  {
    q: "Is there a promo code?",
    a: "We run channel-specific specials from time to time - often tied to where you found us. There isn't a standing public discount on the site. If you saw an offer in an ad, on LinkedIn, or in an email, enter that code on the last step of the lead form before checkout (design fee only - not hosting or the card fee). Otherwise, contact us at hello@998webdesigns.com and we'll tell you what's available.",
  },
];
