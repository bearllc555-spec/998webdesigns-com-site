-- Month-to-month hosting: store Stripe Subscription id from Checkout (subscription mode).
alter table public.wd_leads
  add column if not exists stripe_subscription_id text;
